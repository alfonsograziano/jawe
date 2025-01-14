import { JsonObject } from "@prisma/client/runtime/library";
import { Step, WorkflowTemplate } from "./validateTemplate";
import { WorkflowRunRepository } from "./workflowRunRepo";
import { WorkflowStatus, StepRunStatus, StepRun } from "@prisma/client";
import { pluginRegistryMap } from "./pluginRegistry";
import { EventEmitter } from "events";

type EngineConstructor = {
  workflow: WorkflowTemplate;
  repository: WorkflowRunRepository;
  runId: string;
};

const getNestedValue = (object: any, path: string): any => {
  return path
    .split(".")
    .reduce((acc, key) => (acc ? acc[key] : undefined), object);
};

export class WorkflowEngine {
  workflow: WorkflowTemplate;
  repository: WorkflowRunRepository;
  runId: string;
  stepRuns: StepRun[];
  runningSteps: Record<string, StepRun>;
  eventEmitter: EventEmitter;

  constructor(context: EngineConstructor) {
    this.workflow = context.workflow;
    this.runId = context.runId;
    this.repository = context.repository;
    this.stepRuns = [];
    this.runningSteps = {};
    this.eventEmitter = new EventEmitter();
  }

  async execute() {
    return new Promise(async (resolve, reject) => {
      await this.repository.changeExecutionStatus(
        this.runId,
        WorkflowStatus.RUNNING
      );

      this.eventEmitter.on("onComplete", async () => {
        resolve(
          this.repository.changeExecutionStatus(
            this.runId,
            WorkflowStatus.COMPLETED
          )
        );
      });

      this.eventEmitter.on("onStepFailed", async () => {
        reject(
          this.repository.changeExecutionStatus(
            this.runId,
            WorkflowStatus.FAILED
          )
        );
      });

      try {
        const entryPoint = this.getEntryPointStep();
        this.executeStep(entryPoint);
      } catch (error) {
        console.log(error);
        await this.repository.changeExecutionStatus(
          this.runId,
          WorkflowStatus.FAILED
        );
      }
    });
  }

  getEntryPointStep() {
    const entryPoint = this.workflow.steps.find(
      (step) => step.id === this.workflow.entryPointId
    );
    if (!entryPoint) throw new Error("Cannot find valid entry point step");
    return entryPoint;
  }

  async executeStep(step: Step) {
    const entryPoint = this.getEntryPointStep();
    if (step.id !== entryPoint.id) {
      // Check the running steps and the connections
      const incomingStepsIds = this.workflow.connections
        .filter((conn) => conn.toStepId === step.id)
        .map((conn) => conn.fromStepId);
      const runningStepsIds = Object.keys(this.runningSteps);

      const incomingRunningSteps = incomingStepsIds.filter((stepId) =>
        runningStepsIds.includes(stepId)
      );

      // If there are no running steps with the to with the current step
      // This means that all the executions finished, so we can run the step now

      // Otherwise, it means that other steps are still running
      // so I need to wait for the executeStep to be caled later
      if (incomingRunningSteps.length > 0) {
        console.log(
          "I need to wait, there are other steps still in pending..."
        );
        return;
      }
    }

    const currentStatus = await this.repository.getExecutionStatus(this.runId);
    if (currentStatus === WorkflowStatus.FAILED) {
      console.log("Cannot execute step, workflow already marked as failed");
      return;
    }

    const stepRun = await this.repository.createStepRun(
      step.id,
      this.runId,
      StepRunStatus.RUNNING
    );
    this.stepRuns.push(stepRun);

    try {
      const resolvedInputs = this.resolveInputs(step.id);

      // Add the current run to the stepsObj
      this.runningSteps[step.id] = stepRun;

      const outputs = await this.executePlugin(stepRun, resolvedInputs);

      const stepRunWithOutput = await this.repository.updateStepRunStatus(
        stepRun.id,
        StepRunStatus.COMPLETED,
        outputs
      );

      delete this.runningSteps[step.id];

      // Get all the possible connections and stuff to spawn
      const stepsToExecute = this.getNextStepsToExecute(
        step,
        stepRunWithOutput
      );
      // This path is completed
      if (!stepsToExecute) {
        const runningSteps = Object.keys(this.runningSteps).length;
        // There are no steps running anymore
        // meaning that the one just completed was the last one
        if (runningSteps === 0) {
          this.eventEmitter.emit("onComplete");
          return;
        }
      } else {
        stepsToExecute.forEach((step) => {
          this.executeStep(step);
        });
      }
    } catch (error) {
      console.log(error);
      await this.repository.updateStepRunStatus(
        stepRun.id,
        StepRunStatus.FAILED,
        {}
      );
      this.eventEmitter.emit("onStepFailed");
    }
  }

  getNextStepsToExecute(step: Step, stepRun?: StepRun) {
    const connections = this.workflow.connections.filter(
      (conn) => conn.fromStepId === step.id
    );

    if (!connections) return undefined;

    const candidates = connections.map((connection) => {
      const candidateStep = this.workflow.steps.find(
        (step) => connection.toStepId === step.id
      );
      if (!candidateStep)
        throw new Error("Cannot find candidate defined in connection");

      return candidateStep;
    });

    // We're in one of the end nodes
    if (candidates.length === 0) return undefined;

    // If the output of the lates step contains
    if (stepRun) {
      const nextStepSelectedFromPrevStep =
        this.extractNextStepFromStepRun(stepRun);
      if (nextStepSelectedFromPrevStep) return [nextStepSelectedFromPrevStep];
    }
    return candidates;
  }

  resolveInputs(stepId: string) {
    // Assuming we only got static steps for now
    const inputs = this.workflow.steps.find(
      (step) => step.id === stepId
    )?.inputs;

    if (!inputs) throw new Error("Cannot find inputs in this step");

    const resolvedInputs: Record<string, unknown> = {};

    Object.keys(inputs).forEach((key) => {
      if (
        typeof inputs[key] === "object" &&
        typeof inputs[key].inputSource === "string"
      ) {
        const inputSource = inputs[key].inputSource;
        if (inputSource === "static_value")
          resolvedInputs[key] = inputs[key].staticValue;
        if (inputSource === "step_output") {
          const targetStepId = inputs[key].stepDetails.stepId;
          const stepRunFromStepId = this.stepRuns.find(
            (stepRun) => stepRun.stepId === targetStepId
          );

          if (!stepRunFromStepId)
            throw new Error("Cannot find stepRun id for input lookup");

          const value = getNestedValue(
            stepRunFromStepId.output,
            inputs[key].stepDetails.outputPath
          );
          resolvedInputs[key] = value;
        }
        return;
      }

      resolvedInputs[key] = inputs[key];
    });
    return resolvedInputs;
  }

  async executePlugin(
    stepRun: StepRun,
    resolvedInputs: Record<string, unknown>
  ) {
    // Simulate the execution of the plugin and return mock outputs
    const step = this.workflow.steps.find((step) => step.id === stepRun.stepId);
    if (!step) throw new Error("Cannot find the related step");

    const plugin = pluginRegistryMap.get(step.type);
    if (!plugin) throw new Error("Cannot find plugin");

    const instance = new plugin.default();
    const outputs = await instance.execute(resolvedInputs);

    return outputs;
  }

  extractNextStepFromStepRun(stepRun: StepRun) {
    if (stepRun && typeof stepRun.output === "object") {
      const stepOutput = stepRun.output as JsonObject;
      if (typeof stepOutput.nextStepId === "string") {
        const candidateSelectedByPrevStep = this.workflow.steps.find(
          (step) => stepOutput.nextStepId === step.id
        );
        if (candidateSelectedByPrevStep) return candidateSelectedByPrevStep;
      }
    }
  }
}

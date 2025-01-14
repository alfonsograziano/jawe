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
    const isReadyToExecute = this.isStepReadyToExecute(step);
    if (!isReadyToExecute) return;

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

  getNextStepsToExecute(previousStep: Step, stepRun?: StepRun) {
    const incomingConnections = this.workflow.connections.filter(
      (conn) => conn.fromStepId === previousStep.id
    );

    if (!incomingConnections) return undefined;

    const possibleStepsToExecute = incomingConnections.map((connection) => {
      const candidateStep = this.workflow.steps.find(
        (step) => connection.toStepId === step.id
      );
      if (!candidateStep)
        throw new Error("Cannot find candidate defined in connection");

      return candidateStep;
    });

    // We're in one of the end (leaf) nodes
    if (possibleStepsToExecute.length === 0) return undefined;

    // If the output of the lates step contains a nextStepId preference
    // This is needed for example in the case of a conditional
    if (stepRun) {
      const nextStepSelectedFromPrevStep =
        this.extractNextStepFromStepRun(stepRun);
      if (nextStepSelectedFromPrevStep) return [nextStepSelectedFromPrevStep];
    }

    return possibleStepsToExecute;
  }

  resolveInputs(stepId: string) {
    // Assuming we only got static steps for now
    const expectedInputs = this.workflow.steps.find(
      (step) => step.id === stepId
    )?.inputs;

    if (!expectedInputs) throw new Error("Cannot find inputs in this step");

    const resolvedInputs: Record<string, unknown> = {};

    Object.keys(expectedInputs).forEach((key) => {
      if (
        typeof expectedInputs[key] === "object" &&
        typeof expectedInputs[key].inputSource === "string"
      ) {
        const inputSource = expectedInputs[key].inputSource;
        if (inputSource === "static_value")
          resolvedInputs[key] = expectedInputs[key].staticValue;
        if (inputSource === "step_output") {
          const targetStepId = expectedInputs[key].stepDetails.stepId;
          const stepRunFromStepId = this.stepRuns.find(
            (stepRun) => stepRun.stepId === targetStepId
          );

          if (!stepRunFromStepId)
            throw new Error("Cannot find stepRun id for input lookup");

          const value = getNestedValue(
            stepRunFromStepId.output,
            expectedInputs[key].stepDetails.outputPath
          );
          resolvedInputs[key] = value;
        }
        return;
      }

      // If there is no inputSource specified fallback to a base input resolution
      resolvedInputs[key] = expectedInputs[key];
    });
    return resolvedInputs;
  }

  async executePlugin(
    stepRun: StepRun,
    resolvedInputs: Record<string, unknown>
  ) {
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

  /**
   * Determines if a step in the workflow is ready to execute.
   *
   * In a Directed Acyclic Graph (DAG)-based workflow, a step (or node)
   * can only be executed when all its parent steps (branches that converge
   * into the node) have completed execution. This function checks if all
   * parent steps of the given step are completed and ensures that no
   * parent steps are still running.
   *
   * @param {Object} step - The step object representing the current node in the workflow.
   *                        Must contain a unique `id` property.
   * @returns {boolean} - Returns `true` if the step is ready to execute (all parent
   *                      steps are completed), otherwise `false`.
   *
   */
  isStepReadyToExecute(step: Step) {
    const entryPoint = this.getEntryPointStep();

    // Entry point step is always ready to execute
    if (step.id === entryPoint.id) {
      return true;
    }

    // Find all parent steps (steps with connections leading to the current step)
    const incomingStepsIds = this.workflow.connections
      .filter((conn) => conn.toStepId === step.id)
      .map((conn) => conn.fromStepId);

    // Check which parent steps are still running
    const runningStepsIds = Object.keys(this.runningSteps);
    const incomingRunningSteps = incomingStepsIds.filter((stepId) =>
      runningStepsIds.includes(stepId)
    );

    // Step is ready to execute only if none of the parent steps are still running
    return incomingRunningSteps.length === 0;
  }
}

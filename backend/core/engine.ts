import { JsonObject } from "@prisma/client/runtime/library";
import { Step, WorkflowTemplate } from "./validateTemplate";
import { WorkflowRunRepository } from "./workflowRunRepo";
import { WorkflowStatus, StepRunStatus, StepRun } from "@prisma/client";
import { pluginRegistryMap } from "./pluginRegistry";

type EngineConstructor = {
  workflow: WorkflowTemplate;
  repository: WorkflowRunRepository;
  runId: string;
};

export class WorkflowEngine {
  workflow: WorkflowTemplate;
  repository: WorkflowRunRepository;
  runId: string;

  constructor(context: EngineConstructor) {
    this.workflow = context.workflow;
    this.runId = context.runId;
    this.repository = context.repository;
  }

  async execute() {
    await this.repository.changeExecutionStatus(
      this.runId,
      WorkflowStatus.RUNNING
    );
    const entryPoint = this.getEntryPointStep();

    try {
      await this.executeStep(entryPoint);

      let nextStep = this.getNextStep(entryPoint);
      while (nextStep) {
        const stepRun = await this.executeStep(nextStep);
        nextStep = this.getNextStep(nextStep, stepRun);
      }

      await this.repository.changeExecutionStatus(
        this.runId,
        WorkflowStatus.COMPLETED
      );
    } catch (error) {
      console.log(error);
      await this.repository.changeExecutionStatus(
        this.runId,
        WorkflowStatus.FAILED
      );
      throw new Error(`Workflow execution failed: ${(error as Error).message}`);
    }
  }

  getEntryPointStep() {
    const entryPoint = this.workflow.steps.find(
      (step) => step.id === this.workflow.entryPointId
    );
    if (!entryPoint) throw new Error("Cannot find valid entry point step");
    return entryPoint;
  }

  async executeStep(step: Step) {
    const currentStatus = await this.repository.getExecutionStatus(this.runId);
    if (currentStatus === WorkflowStatus.FAILED) {
      throw new Error("Cannot execute step, workflow already marked as failed");
    }

    const stepRun = await this.repository.createStepRun(
      step.id,
      this.runId,
      StepRunStatus.RUNNING
    );

    try {
      const resolvedInputs = this.resolveInputs(step.id);

      const outputs = await this.executePlugin(stepRun, resolvedInputs);

      return this.repository.updateStepRunStatus(
        stepRun.id,
        StepRunStatus.COMPLETED,
        outputs
      );
    } catch (error) {
      console.log(error);
      await this.repository.updateStepRunStatus(
        stepRun.id,
        StepRunStatus.FAILED,
        {}
      );
      throw new Error("Execution failed");
    }
  }

  getNextStep(step: Step, stepRun?: StepRun) {
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
      if (nextStepSelectedFromPrevStep) return nextStepSelectedFromPrevStep;
    }

    if (candidates.length === 1) return candidates[0];

    // Based on the previous step output with the reserved word

    // Don't manage for now the case of multiple candidates (parallel executions)
    // TODO: Allow for multple, parallel executions
    return candidates[0];
  }

  resolveInputs(stepId: string) {
    // Assuming we only got static steps for now
    const inputs = this.workflow.steps.find(
      (step) => step.id === stepId
    )?.inputs;

    if (!inputs) throw new Error("Cannot find inputs in this step");

    return inputs;
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

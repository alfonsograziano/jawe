import { Step, WorkflowTemplate } from "./validateTemplate";
import { WorkflowRunRepository } from "./workflowRunRepo";
import { WorkflowStatus, StepRunStatus } from "@prisma/client";

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
        await this.executeStep(nextStep);
        nextStep = this.getNextStep(nextStep);
      }

      await this.repository.changeExecutionStatus(
        this.runId,
        WorkflowStatus.COMPLETED
      );
    } catch (error) {
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

      // Simulate plugin execution and get the outputs as result
      const outputs = await this.simulatePluginExecution(step, resolvedInputs);

      await this.repository.updateStepRunStatus(
        stepRun.id,
        StepRunStatus.COMPLETED,
        outputs
      );
    } catch (error) {
      await this.repository.updateStepRunStatus(
        stepRun.id,
        StepRunStatus.FAILED,
        {}
      );
      throw new Error("Execution failed");
    }
  }

  getNextStep(step: Step) {
    const connection = this.workflow.connections.find(
      (conn) => conn.fromStepId === step.id
    );

    if (!connection) return undefined;

    return this.workflow.steps.find((s) => s.id === connection.toStepId);
  }

  resolveInputs(stepId: string) {
    const inputs = this.workflow.steps.find(
      (step) => step.id === stepId
    )?.inputs;

    if (!inputs) throw new Error("Cannot find inputs in this step");

    return inputs;
  }

  async simulatePluginExecution(step: Step, inputs: Record<string, unknown>) {
    // Simulate the execution of the plugin and return mock outputs
    return { success: true, data: `Executed step ${step.name}` };
  }
}

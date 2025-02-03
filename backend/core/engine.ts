import { JsonObject } from "@prisma/client/runtime/library";
import { Step, WorkflowTemplate } from "./validateTemplate";
import { WorkflowRunRepository } from "./workflowRunRepo";
import {
  WorkflowStatus,
  StepRunStatus,
  StepRun,
  TriggerRun,
} from "@prisma/client";
import { pluginRegistryMap } from "./pluginRegistry";
import { resolveDynamicInputs } from "./utils/resolveDynamicFields";

type WorkflowRun = {
  id: string;
  triggerRun: TriggerRun;
  stepRuns: StepRun[];
};

type EngineConstructor = {
  workflow: WorkflowTemplate;
  repository: WorkflowRunRepository;
  workflowRun: WorkflowRun;
};

export class WorkflowEngine {
  workflow: WorkflowTemplate;
  repository: WorkflowRunRepository;
  workflowRun: WorkflowRun;
  dependencyCount: Record<string, number> = {};

  constructor(context: EngineConstructor) {
    this.workflow = context.workflow;
    this.repository = context.repository;
    this.workflowRun = context.workflowRun;
  }

  computeDependencies() {
    // Initialize each step with 0 prerequisites.
    for (const step of this.workflow.steps) {
      this.dependencyCount[step.id] = 0;
    }

    for (const conn of this.workflow.connections) {
      // Each connection adds one prerequisite to the target step.
      this.dependencyCount[conn.toStepId] =
        (this.dependencyCount[conn.toStepId] || 0) + 1;
    }
  }

  async execute() {
    this.computeDependencies();

    await this.repository.changeExecutionStatus(
      this.workflowRun.id,
      WorkflowStatus.RUNNING
    );

    try {
      const entryPoint = this.getEntryPointStep();
      await this.executeStep(entryPoint);

      await this.repository.changeExecutionStatus(
        this.workflowRun.id,
        WorkflowStatus.COMPLETED
      );
    } catch (error) {
      await this.repository.changeExecutionStatus(
        this.workflowRun.id,
        WorkflowStatus.FAILED
      );
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
    const currentStatus = await this.repository.getExecutionStatus(
      this.workflowRun.id
    );
    // Cannot execute step, workflow already marked as failed
    if (currentStatus === WorkflowStatus.FAILED) {
      return;
    }

    const stepRun = await this.repository.createStepRun(
      step.id,
      this.workflowRun.id,
      StepRunStatus.RUNNING
    );
    this.workflowRun.stepRuns.push(stepRun);

    let stepRunWithOutput;

    try {
      const resolvedInputs = this.resolveInputs(step.id);

      const outputs = await this.executePlugin(stepRun, resolvedInputs);
      const localRun = this.workflowRun.stepRuns.find(
        (run) => run.id === stepRun.id
      );
      if (!localRun) throw new Error("Cannot find local run");
      // Updating local run with the generated outputs
      // So that can be used as input for a next step
      localRun.output = outputs;

      stepRunWithOutput = await this.repository.updateStepRunStatus(
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
      await this.repository.changeExecutionStatus(
        this.workflowRun.id,
        WorkflowStatus.FAILED
      );
      throw error;
    }

    const stepsToExecute = this.getNextStepsToExecute(step, stepRunWithOutput);

    await Promise.all(
      stepsToExecute.map(async (childStep) => {
        this.dependencyCount[childStep.id]--;
        if (this.dependencyCount[childStep.id] === 0) {
          return this.executeStep(childStep);
        }
      })
    );
  }

  getNextStepsToExecute(previousStep: Step, stepRun?: StepRun) {
    const incomingConnections = this.workflow.connections.filter(
      (conn) => conn.fromStepId === previousStep.id
    );

    const possibleStepsToExecute = incomingConnections.map((connection) => {
      const candidateStep = this.workflow.steps.find(
        (step) => connection.toStepId === step.id
      );
      if (!candidateStep)
        throw new Error("Cannot find candidate defined in connection");

      return candidateStep;
    });

    // We're in one of the end (leaf) nodes
    if (possibleStepsToExecute.length === 0) return [];

    // If the output of the lates step contains a nextStepId preference
    // This is needed for example in the case of a conditional
    if (stepRun) {
      const nextStepSelectedFromPrevStep =
        this.extractNextStepFromStepRun(stepRun);
      if (nextStepSelectedFromPrevStep) return [nextStepSelectedFromPrevStep];
    }

    return possibleStepsToExecute;
  }

  /**
   * Resolves the inputs for a given step in the workflow.
   *
   * This function processes the expected inputs of a step, resolving any reserved
   * keywords (e.g., `inputSource`) found in the input definitions. Reserved keywords
   * indicate references to other steps or triggers and their associated outputs.
   * The function identifies and retrieves the referenced data to construct the resolved
   * inputs for the step.
   *
   * @param {string} stepId - The ID of the step for which inputs are being resolved.
   * @returns {Record<string, unknown>} - An object containing the resolved inputs for the step.
   *
   * @throws {Error} - Throws an error if inputs for the specified step cannot be found,
   *                   or if a referenced step or trigger output is missing.
   */
  resolveInputs(stepId: string) {
    const expectedInputs = this.workflow.steps.find(
      (step) => step.id === stepId
    )?.inputs;

    if (!expectedInputs) throw new Error("Cannot find inputs in this step");
    return resolveDynamicInputs(
      expectedInputs,
      this.workflowRun.stepRuns,
      this.workflowRun.triggerRun
    );
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

  /**
   * Extracts the next step in the workflow based on the output of a completed step.
   *
   * This function checks the output of a given `StepRun` for a `nextStepId` property,
   * which indicates the ID of the next step to execute. If a valid `nextStepId` is found,
   * it verifies that the step exists in the workflow. If so, it returns the corresponding
   * step object.
   *
   * @param {StepRun} stepRun - The completed step run whose output may specify the next step.
   * @returns {Step | undefined} - The next step in the workflow if found; otherwise, undefined.
   */
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

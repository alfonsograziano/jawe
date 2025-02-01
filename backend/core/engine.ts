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
import { EventEmitter } from "events";
import { resolveDynamicInputs } from "./utils/resolveDynamicFields";

type EngineConstructor = {
  workflow: WorkflowTemplate;
  repository: WorkflowRunRepository;
  runId: string;
  triggerRun: TriggerRun;
};

const events = {
  ON_COMPLETE: "onComplete",
  ON_STEP_FAILED: "onStepFailed",
};

export class WorkflowEngine {
  workflow: WorkflowTemplate;
  repository: WorkflowRunRepository;
  runId: string;
  stepRuns: StepRun[];
  currentlyRunningSteps: Record<string, StepRun>;
  // TODO: Refactor this at some point to pass the workflowRun instead of runIf and triggerRun
  triggerRun: TriggerRun;
  eventEmitter: EventEmitter;

  constructor(context: EngineConstructor) {
    this.workflow = context.workflow;
    this.runId = context.runId;
    this.repository = context.repository;
    this.stepRuns = [];
    this.currentlyRunningSteps = {};
    this.eventEmitter = new EventEmitter();
    this.triggerRun = context.triggerRun;
  }

  async execute() {
    return new Promise(async (resolve) => {
      await this.repository.changeExecutionStatus(
        this.runId,
        WorkflowStatus.RUNNING
      );

      this.eventEmitter.on(events.ON_COMPLETE, async () => {
        await this.repository.changeExecutionStatus(
          this.runId,
          WorkflowStatus.COMPLETED
        );
        resolve({
          success: true,
        });
      });

      this.eventEmitter.on(events.ON_STEP_FAILED, async () => {
        await this.repository.changeExecutionStatus(
          this.runId,
          WorkflowStatus.FAILED
        );
        resolve({
          success: false,
        });
      });

      try {
        const entryPoint = this.getEntryPointStep();
        this.executeStep(entryPoint);
      } catch (error) {
        this.eventEmitter.emit(events.ON_STEP_FAILED);
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
    // Cannot execute step, workflow already marked as failed
    if (currentStatus === WorkflowStatus.FAILED) {
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

      this.currentlyRunningSteps[step.id] = stepRun;

      const outputs = await this.executePlugin(stepRun, resolvedInputs);
      const localRun = this.stepRuns.find((run) => run.id === stepRun.id);
      if (!localRun) throw new Error("Cannot find local run");
      // Updating local run with the generated outputs
      // So that can be used as input for a next step
      localRun.output = outputs;

      const stepRunWithOutput = await this.repository.updateStepRunStatus(
        stepRun.id,
        StepRunStatus.COMPLETED,
        outputs
      );

      delete this.currentlyRunningSteps[step.id];

      // Get all the possible connections and stuff to spawn
      const stepsToExecute = this.getNextStepsToExecute(
        step,
        stepRunWithOutput
      );
      // This path is completed
      if (!stepsToExecute) {
        const runningSteps = Object.keys(this.currentlyRunningSteps).length;
        // There are no steps running anymore
        // meaning that the one just completed was the last one
        if (runningSteps === 0) {
          this.eventEmitter.emit(events.ON_COMPLETE);
        }
      } else {
        stepsToExecute.forEach((step) => {
          this.executeStep(step);
        });
      }
    } catch (error) {
      await this.repository.updateStepRunStatus(
        stepRun.id,
        StepRunStatus.FAILED,
        {}
      );
      this.eventEmitter.emit(events.ON_STEP_FAILED);
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
    // Assuming we only got static steps for now
    const expectedInputs = this.workflow.steps.find(
      (step) => step.id === stepId
    )?.inputs;

    if (!expectedInputs) throw new Error("Cannot find inputs in this step");
    return resolveDynamicInputs(expectedInputs, this.stepRuns, this.triggerRun);
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
    const runningStepsIds = Object.keys(this.currentlyRunningSteps);
    const incomingRunningSteps = incomingStepsIds.filter((stepId) =>
      runningStepsIds.includes(stepId)
    );

    // Step is ready to execute only if none of the parent steps are still running
    return incomingRunningSteps.length === 0;
  }
}

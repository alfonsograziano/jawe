import { WorkflowStatus, StepRunStatus } from "@prisma/client";
import { createStepRunId, stepRuns, workflowRuns } from "./mockData";
import { JsonValue } from "@prisma/client/runtime/library";

export class WorkflowRunRepositoryMock {
  async changeExecutionStatus(runId: string, status: WorkflowStatus) {
    if (!workflowRuns[runId]) {
      throw new Error(`Workflow run with id ${runId} does not exist`);
    }
    workflowRuns[runId].status = status;
    return workflowRuns[runId];
  }

  async getExecutionStatus(runId: string) {
    if (!workflowRuns[runId]) {
      throw new Error(`Workflow run with id ${runId} does not exist`);
    }
    return workflowRuns[runId].status;
  }

  async createStepRun(stepId: string, runId: string, status: StepRunStatus) {
    const stepRunId = createStepRunId(runId, stepId);
    if (stepRuns[stepRunId]) {
      throw new Error(`Step run with id ${stepRunId} already exists`);
    }
    stepRuns[stepRunId] = {
      status,
      output: {},
      id: stepRunId,
      createdAt: new Date(),
      stepId: stepId,
      runId,
      updatedAt: new Date(),
    };
    return { ...stepRuns[stepRunId] };
  }

  async changeStepRunStatus(stepRunId: string, status: StepRunStatus) {
    if (!stepRuns[stepRunId]) {
      throw new Error(`Step run with id ${stepRunId} does not exist`);
    }
    stepRuns[stepRunId].status = status;
    return stepRuns[stepRunId];
  }

  async updateStepRunStatus(
    stepRunId: string,
    status: StepRunStatus,
    output: Record<string, unknown>
  ) {
    if (!stepRuns[stepRunId]) {
      throw new Error(`Step run with id ${stepRunId} does not exist`);
    }
    stepRuns[stepRunId].status = status;
    stepRuns[stepRunId].output = output as JsonValue;
    return stepRuns[stepRunId];
  }
}

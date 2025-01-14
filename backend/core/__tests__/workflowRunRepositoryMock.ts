import { WorkflowStatus, StepRunStatus } from "@prisma/client";
import { createStepRunId, buildMockData } from "./mockData";
import { JsonValue } from "@prisma/client/runtime/library";

export class WorkflowRunRepositoryMock {
  mockData: ReturnType<typeof buildMockData>;

  constructor(mockData: ReturnType<typeof buildMockData>) {
    this.mockData = mockData;
  }

  async changeExecutionStatus(runId: string, status: WorkflowStatus) {
    if (!this.mockData.workflowRuns[runId]) {
      throw new Error(`Workflow run with id ${runId} does not exist`);
    }
    this.mockData.workflowRuns[runId].status = status;
    return this.mockData.workflowRuns[runId];
  }

  async getExecutionStatus(runId: string) {
    if (!this.mockData.workflowRuns[runId]) {
      throw new Error(`Workflow run with id ${runId} does not exist`);
    }
    return this.mockData.workflowRuns[runId].status;
  }

  async createStepRun(stepId: string, runId: string, status: StepRunStatus) {
    const stepRunId = createStepRunId(runId, stepId);
    if (this.mockData.stepRuns[stepRunId]) {
      throw new Error(`Step run with id ${stepRunId} already exists`);
    }
    this.mockData.stepRuns[stepRunId] = {
      status,
      output: {},
      id: stepRunId,
      createdAt: new Date(),
      stepId: stepId,
      runId,
      updatedAt: new Date(),
    };
    return this.mockData.stepRuns[stepRunId];
  }

  async changeStepRunStatus(stepRunId: string, status: StepRunStatus) {
    if (!this.mockData.stepRuns[stepRunId]) {
      throw new Error(`Step run with id ${stepRunId} does not exist`);
    }
    this.mockData.stepRuns[stepRunId].status = status;
    return this.mockData.stepRuns[stepRunId];
  }

  async updateStepRunStatus(
    stepRunId: string,
    status: StepRunStatus,
    output: Record<string, unknown>
  ) {
    if (!this.mockData.stepRuns[stepRunId]) {
      throw new Error(`Step run with id ${stepRunId} does not exist`);
    }
    this.mockData.stepRuns[stepRunId].status = status;
    this.mockData.stepRuns[stepRunId].output = output as JsonValue;
    return this.mockData.stepRuns[stepRunId];
  }

  // This method is available only in the mock instance
  // Not in the real repository
  getMockData() {
    return this.mockData;
  }
}

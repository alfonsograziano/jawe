import { describe, it, expect } from "vitest";
import "../workflowRunRepo";
import { WorkflowRunRepositoryMock } from "./workflowRunRepositoryMock";
import { WorkflowEngine } from "../engine";
import { WorkflowRunRepository } from "../workflowRunRepo";
import { mockBasicWorkflowTemplate, workflowRuns } from "./mockData";
import { WorkflowStatus } from "@prisma/client";

describe("WorkflowEngine", () => {
  const mockRunId = "run1";

  it("should execute a workflow successfully", async () => {
    const engine = new WorkflowEngine({
      workflow: mockBasicWorkflowTemplate,
      repository:
        new WorkflowRunRepositoryMock() as unknown as WorkflowRunRepository,
      runId: mockRunId,
    });

    await engine.execute();

    expect(workflowRuns[mockRunId].status).toBe(WorkflowStatus.COMPLETED);
  });
});

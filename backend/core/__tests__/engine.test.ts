import { describe, it, expect, beforeAll } from "vitest";
import "../workflowRunRepo";
import { WorkflowRunRepositoryMock } from "./workflowRunRepositoryMock";
import { WorkflowEngine } from "../engine";
import { WorkflowRunRepository } from "../workflowRunRepo";
import {
  mockBasicWorkflowTemplate,
  mockWorkflowTemplateWithConditionalPlugin,
  stepRuns,
  workflowRuns,
} from "./mockData";
import { WorkflowStatus } from "@prisma/client";
import { initPluginsRegistry } from "../pluginRegistry";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("WorkflowEngine", () => {
  const mockRunId = "run1";

  beforeAll(async () => {
    const pluginsDir = path.resolve(__dirname, "plugins");
    await initPluginsRegistry(pluginsDir);
  });

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

  it("should execute a workflow with conditionals successfully", async () => {
    const engine = new WorkflowEngine({
      workflow: mockWorkflowTemplateWithConditionalPlugin,
      repository:
        new WorkflowRunRepositoryMock() as unknown as WorkflowRunRepository,
      runId: "run1WithConditionals",
    });

    await engine.execute();

    expect(workflowRuns["run1WithConditionals"].status).toBe(
      WorkflowStatus.COMPLETED
    );
  });
});

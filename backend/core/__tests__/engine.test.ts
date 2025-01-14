import { describe, it, expect, beforeAll } from "vitest";
import "../workflowRunRepo";
import { WorkflowRunRepositoryMock } from "./workflowRunRepositoryMock";
import { WorkflowEngine } from "../engine";
import { WorkflowRunRepository } from "../workflowRunRepo";
import {
  mockBasicWorkflowTemplate,
  mockWorkflowTemplateWithConditionalPlugin,
  buildMockData,
  createStepRunId,
  mockWorkflowTemplateWithInputs,
} from "./mockData";
import { StepRunStatus, WorkflowStatus } from "@prisma/client";
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
    const repository = new WorkflowRunRepositoryMock(buildMockData());

    const engine = new WorkflowEngine({
      workflow: mockBasicWorkflowTemplate,
      repository: repository as unknown as WorkflowRunRepository,
      runId: mockRunId,
    });

    await engine.execute();

    expect(repository.getMockData().workflowRuns[mockRunId].status).toBe(
      WorkflowStatus.COMPLETED
    );
  });

  it("should execute a workflow with conditionals successfully", async () => {
    const repository = new WorkflowRunRepositoryMock(buildMockData());

    const engine = new WorkflowEngine({
      workflow: mockWorkflowTemplateWithConditionalPlugin,
      repository: repository as unknown as WorkflowRunRepository,

      runId: "run1WithConditionals",
    });

    await engine.execute();

    expect(
      repository.getMockData().workflowRuns["run1WithConditionals"].status
    ).toBe(WorkflowStatus.COMPLETED);
  });

  it("should execute a the right step in a conditional statement", async () => {
    const repository = new WorkflowRunRepositoryMock(buildMockData());
    const runId = "run1WithConditionals";
    const engine = new WorkflowEngine({
      workflow: mockWorkflowTemplateWithConditionalPlugin,
      repository: repository as unknown as WorkflowRunRepository,
      runId,
    });

    await engine.execute();

    expect(
      repository.getMockData().workflowRuns["run1WithConditionals"].status
    ).toBe(WorkflowStatus.COMPLETED);

    const expectedStepToRun = "step2";
    const epxectedStepToNotRun = "step3";

    expect(
      repository.getMockData().stepRuns[
        createStepRunId(runId, expectedStepToRun)
      ].status
    ).toBe(StepRunStatus.COMPLETED);

    expect(
      repository.getMockData().stepRuns[
        createStepRunId(runId, epxectedStepToNotRun)
      ]
    ).toBe(undefined);
  });

  it("should execute a step and take the right input as param", async () => {
    const repository = new WorkflowRunRepositoryMock(buildMockData());
    const runId = "run1WithConditionals";
    const engine = new WorkflowEngine({
      workflow: mockWorkflowTemplateWithConditionalPlugin,
      repository: repository as unknown as WorkflowRunRepository,
      runId,
    });

    await engine.execute();

    expect(
      repository.getMockData().workflowRuns["run1WithConditionals"].status
    ).toBe(WorkflowStatus.COMPLETED);

    const expectedStepToRun = "step2";
    const epxectedStepToNotRun = "step3";

    expect(
      repository.getMockData().stepRuns[
        createStepRunId(runId, expectedStepToRun)
      ].status
    ).toBe(StepRunStatus.COMPLETED);

    expect(
      repository.getMockData().stepRuns[
        createStepRunId(runId, epxectedStepToNotRun)
      ]
    ).toBe(undefined);
  });

  it("the run step should contain the output of the plugin", async () => {
    const repository = new WorkflowRunRepositoryMock(buildMockData());
    const runId = "run1WithInputs";
    const engine = new WorkflowEngine({
      workflow: mockWorkflowTemplateWithInputs,
      repository: repository as unknown as WorkflowRunRepository,
      runId,
    });

    await engine.execute();

    expect(repository.getMockData().workflowRuns["run1WithInputs"].status).toBe(
      WorkflowStatus.COMPLETED
    );

    const expectedStepToRun = "step1";

    expect(
      repository.getMockData().stepRuns[
        createStepRunId(runId, expectedStepToRun)
      ].status
    ).toBe(StepRunStatus.COMPLETED);

    expect(
      repository.getMockData().stepRuns[
        createStepRunId(runId, expectedStepToRun)
      ].output
    ).toEqual({ hello: "world" });
  });

  it("the run step should take the right dynamic input from an output and process it", async () => {
    const repository = new WorkflowRunRepositoryMock(buildMockData());
    const runId = "run1WithInputs";
    const engine = new WorkflowEngine({
      workflow: mockWorkflowTemplateWithInputs,
      repository: repository as unknown as WorkflowRunRepository,
      runId,
    });

    await engine.execute();

    expect(repository.getMockData().workflowRuns["run1WithInputs"].status).toBe(
      WorkflowStatus.COMPLETED
    );

    // This step should take {hello: "world"} as input from the step1 output
    const expectedStepToRun = "step2";

    expect(
      repository.getMockData().stepRuns[
        createStepRunId(runId, expectedStepToRun)
      ].status
    ).toBe(StepRunStatus.COMPLETED);

    expect(
      repository.getMockData().stepRuns[
        createStepRunId(runId, expectedStepToRun)
      ].output
    ).toEqual({ greetings: "Hello world" });
  });
});

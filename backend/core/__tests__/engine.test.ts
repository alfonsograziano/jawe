import { describe, it, expect, beforeAll, vi } from "vitest";
import "../workflowRunRepo";
import { WorkflowRunRepositoryMock } from "./workflowRunRepositoryMock";
import { WorkflowEngine } from "../engine";
import { WorkflowRunRepository } from "../workflowRunRepo";
import { buildMockData, createStepRunId } from "./mockData";
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
      workflow: buildMockData().mockBasicWorkflowTemplate,
      repository: repository as unknown as WorkflowRunRepository,
      runId: mockRunId,
    });

    await engine.execute();

    expect(repository.getMockData().workflowRuns[mockRunId].status).toBe(
      WorkflowStatus.COMPLETED
    );
  });

  it("workflow should fail if a plugin fails", async () => {
    const repository = new WorkflowRunRepositoryMock(buildMockData());
    const runId = "runWithFailureInjection";
    const engine = new WorkflowEngine({
      workflow: buildMockData().mockWTWithFailureInjected,
      repository: repository as unknown as WorkflowRunRepository,
      runId,
    });

    await engine.execute();

    expect(repository.getMockData().workflowRuns[runId].status).toBe(
      WorkflowStatus.FAILED
    );

    expect(
      repository.getMockData().stepRuns[createStepRunId(runId, "step1")].status
    ).toBe(WorkflowStatus.FAILED);

    // Step 2 shouldn't be reached as Step 1 failed
    expect(
      repository.getMockData().stepRuns[createStepRunId(runId, "step2")]
    ).toBe(undefined);
  });

  it("should execute a workflow with conditionals successfully", async () => {
    const repository = new WorkflowRunRepositoryMock(buildMockData());

    const engine = new WorkflowEngine({
      workflow: buildMockData().mockWorkflowTemplateWithConditionalPlugin,
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
      workflow: buildMockData().mockWorkflowTemplateWithConditionalPlugin,
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
      workflow: buildMockData().mockWorkflowTemplateWithConditionalPlugin,
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

  it("should execute a step and take the right static input as param", async () => {
    const repository = new WorkflowRunRepositoryMock(buildMockData());
    const runId = "run1WithInputs";
    const engine = new WorkflowEngine({
      workflow: buildMockData().mockWorkflowTemplateWithStaticInputs,
      repository: repository as unknown as WorkflowRunRepository,
      runId,
    });

    await engine.execute();

    expect(repository.getMockData().workflowRuns[runId].status).toBe(
      WorkflowStatus.COMPLETED
    );

    expect(
      repository.getMockData().stepRuns[createStepRunId(runId, "step1")].status
    ).toBe(StepRunStatus.COMPLETED);

    expect(
      repository.getMockData().stepRuns[createStepRunId(runId, "step1")].output
    ).toEqual({ greetings: "Hello pippo" });
  });

  it("the run step should contain the output of the plugin", async () => {
    const repository = new WorkflowRunRepositoryMock(buildMockData());
    const runId = "run1WithInputs";
    const engine = new WorkflowEngine({
      workflow: buildMockData().mockWorkflowTemplateWithInputs,
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
      workflow: buildMockData().mockWorkflowTemplateWithInputs,
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

  it("should execute 2 steps in parallel after the entry point", async () => {
    const repository = new WorkflowRunRepositoryMock(buildMockData());
    const runId = "run1Parallel";
    const engine = new WorkflowEngine({
      workflow: buildMockData().mockWTWithParallelExecution,
      repository: repository as unknown as WorkflowRunRepository,
      runId,
    });

    await engine.execute();

    expect(repository.getMockData().workflowRuns[runId].status).toBe(
      WorkflowStatus.COMPLETED
    );

    const expectedStepsToRun = ["step2", "step3"];
    for (const expectedStep of expectedStepsToRun) {
      expect(
        repository.getMockData().stepRuns[createStepRunId(runId, expectedStep)]
          .status
      ).toBe(StepRunStatus.COMPLETED);
    }
  });

  it("should wait to execute a step until all converging steps are done", async () => {
    const repository = new WorkflowRunRepositoryMock(buildMockData());
    const runId = "run2Parallel";
    const engine = new WorkflowEngine({
      workflow: buildMockData().mockWTWithParallelExecutionAndConvergentStep,
      repository: repository as unknown as WorkflowRunRepository,
      runId,
    });

    const spy = vi.spyOn(engine, "isStepReadyToExecute");
    await engine.execute();

    expect(repository.getMockData().workflowRuns[runId].status).toBe(
      WorkflowStatus.COMPLETED
    );

    const expectedStepsToRun = ["step2", "step3", "step4"];
    for (const expectedStep of expectedStepsToRun) {
      expect(
        repository.getMockData().stepRuns[createStepRunId(runId, expectedStep)]
          .status
      ).toBe(StepRunStatus.COMPLETED);
    }

    // When I'm executing it with the fastest step, I want it to return false
    // As we still have another step running in parallel
    const callsWithFalseReturn = spy.mock.calls.filter((_, index) => {
      return (
        spy.mock.results[index].type === "return" &&
        spy.mock.results[index].value === false
      );
    });

    // I should get false when I try to call the last step
    // As it gets called twice and the first time the other one is still occupied
    expect(callsWithFalseReturn[0][0]).toEqual({
      id: "step4",
      name: "Step 4",
      inputs: {},
      isConfigured: true,
      type: "example-plugin",
      visualizationMetadata: expect.objectContaining({}),
    });
    expect(callsWithFalseReturn.length).toBe(1);
  });

  it("should recognize a failure in a previous step on a different branch and stop its execution immediately", async () => {
    const repository = new WorkflowRunRepositoryMock(buildMockData());
    const runId = "runWithParallelAndFailure";
    const engine = new WorkflowEngine({
      workflow: buildMockData().mockWTWithParallelExecutionAndFaiure,
      repository: repository as unknown as WorkflowRunRepository,
      runId,
    });

    await engine.execute();

    expect(repository.getMockData().workflowRuns[runId].status).toBe(
      WorkflowStatus.FAILED
    );

    expect(
      repository.getMockData().stepRuns[createStepRunId(runId, "step1")].status
    ).toBe(WorkflowStatus.COMPLETED);

    expect(
      repository.getMockData().stepRuns[createStepRunId(runId, "step2")].status
    ).toBe(WorkflowStatus.FAILED);

    expect(
      repository.getMockData().stepRuns[createStepRunId(runId, "step3")].status
    ).toBe(WorkflowStatus.COMPLETED);

    // Step 4 shouldn't be executed after Step 3 as Step 2 failed
    expect(
      repository.getMockData().stepRuns[createStepRunId(runId, "step4")]
    ).toBe(undefined);
  });
});

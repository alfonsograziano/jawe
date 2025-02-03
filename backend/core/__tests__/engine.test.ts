import { describe, it, expect, beforeAll, vi } from "vitest";
import "../workflowRunRepo";
import { WorkflowRunRepositoryMock } from "./workflowRunRepositoryMock";
import { WorkflowEngine } from "../engine";
import { WorkflowRunRepository } from "../workflowRunRepo";
import {
  buildMockData,
  createStepRunId,
  baseTriggerRun,
  triggerRunWithOutputs,
  buildWorkflowRun,
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
      workflow: buildMockData().mockBasicWorkflowTemplate,
      repository: repository as unknown as WorkflowRunRepository,
      workflowRun: buildWorkflowRun({
        runId: mockRunId,
        triggerRun: baseTriggerRun,
      }),
    });

    await engine.execute();

    expect(repository.getMockData().workflowRuns[mockRunId].status).toBe(
      WorkflowStatus.COMPLETED
    );
  });

  //TODO: Add more tests for resolve inputs with nested values

  it("workflow should fail if a plugin fails", async () => {
    const repository = new WorkflowRunRepositoryMock(buildMockData());
    const runId = "runWithFailureInjection";
    const engine = new WorkflowEngine({
      workflow: buildMockData().mockWTWithFailureInjected,
      repository: repository as unknown as WorkflowRunRepository,
      workflowRun: buildWorkflowRun({
        runId,
        triggerRun: baseTriggerRun,
      }),
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
    const runId = "run1WithConditionals";
    const engine = new WorkflowEngine({
      workflow: buildMockData().mockWorkflowTemplateWithConditionalPlugin,
      repository: repository as unknown as WorkflowRunRepository,
      workflowRun: buildWorkflowRun({
        runId,
        triggerRun: baseTriggerRun,
      }),
    });

    await engine.execute();

    expect(repository.getMockData().workflowRuns[runId].status).toBe(
      WorkflowStatus.COMPLETED
    );
  });

  it("should execute a the right step in a conditional statement", async () => {
    const repository = new WorkflowRunRepositoryMock(buildMockData());
    const runId = "run1WithConditionals";
    const engine = new WorkflowEngine({
      workflow: buildMockData().mockWorkflowTemplateWithConditionalPlugin,
      repository: repository as unknown as WorkflowRunRepository,
      workflowRun: buildWorkflowRun({
        runId,
        triggerRun: baseTriggerRun,
      }),
    });

    await engine.execute();

    expect(repository.getMockData().workflowRuns[runId].status).toBe(
      WorkflowStatus.COMPLETED
    );

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
      workflowRun: buildWorkflowRun({
        runId,
        triggerRun: baseTriggerRun,
      }),
    });

    await engine.execute();

    expect(repository.getMockData().workflowRuns[runId].status).toBe(
      WorkflowStatus.COMPLETED
    );

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
      workflowRun: buildWorkflowRun({
        runId,
        triggerRun: baseTriggerRun,
      }),
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
      workflowRun: buildWorkflowRun({
        runId,
        triggerRun: baseTriggerRun,
      }),
    });

    await engine.execute();

    expect(repository.getMockData().workflowRuns[runId].status).toBe(
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
      workflowRun: buildWorkflowRun({
        runId,
        triggerRun: baseTriggerRun,
      }),
    });

    await engine.execute();

    expect(repository.getMockData().workflowRuns[runId].status).toBe(
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
      workflowRun: buildWorkflowRun({
        runId,
        triggerRun: baseTriggerRun,
      }),
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
      workflowRun: buildWorkflowRun({
        runId,
        triggerRun: baseTriggerRun,
      }),
    });

    // Spy on the repository’s createStepRun so we can later check in which order
    // steps were started. In the new implementation, dependency management is done
    // internally by decrementing a dependency counter. This spy helps us verify that
    // the convergent step (here "step4") is only started after its two prerequisites
    // ("step2" and "step3") have both been started.
    const createStepRunSpy = vi.spyOn(repository, "createStepRun");

    await engine.execute();

    const wfRun = repository.getMockData().workflowRuns[runId];
    expect(wfRun.status).toBe(WorkflowStatus.COMPLETED);

    const expectedStepsToRun = ["step2", "step3", "step4"];
    for (const stepId of expectedStepsToRun) {
      const stepRun =
        repository.getMockData().stepRuns[createStepRunId(runId, stepId)];
      expect(stepRun.status).toBe(StepRunStatus.COMPLETED);
    }

    // Because step4 has two incoming connections (from step2 and step3),
    // its step run should only be created after both step2 and step3 have been started.
    // We extract the order from the createStepRun spy.
    const stepRunCalls = createStepRunSpy.mock.calls
      .map((args) => ({
        stepId: args[0] as string,
        workflowRunId: args[1] as string,
      }))
      .filter((call) => call.workflowRunId === runId);

    const indexStep2 = stepRunCalls.findIndex(
      (call) => call.stepId === "step2"
    );
    const indexStep3 = stepRunCalls.findIndex(
      (call) => call.stepId === "step3"
    );
    const indexStep4 = stepRunCalls.findIndex(
      (call) => call.stepId === "step4"
    );

    expect(indexStep4).toBeGreaterThan(indexStep2);
    expect(indexStep4).toBeGreaterThan(indexStep3);
  });
  it("should recognize a failure in a previous step on a different branch and stop its execution immediately", async () => {
    const repository = new WorkflowRunRepositoryMock(buildMockData());
    const runId = "runWithParallelAndFailure";
    const engine = new WorkflowEngine({
      workflow: buildMockData().mockWTWithParallelExecutionAndFaiure,
      repository: repository as unknown as WorkflowRunRepository,
      workflowRun: buildWorkflowRun({
        runId,
        triggerRun: baseTriggerRun,
      }),
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

  it("should load the input from a trigger", async () => {
    const repository = new WorkflowRunRepositoryMock(buildMockData());
    const runId = "runWithInputTrigger";
    const engine = new WorkflowEngine({
      workflow: buildMockData().mockWTWithInputFromTrigger,
      repository: repository as unknown as WorkflowRunRepository,
      workflowRun: buildWorkflowRun({
        runId,
        triggerRun: triggerRunWithOutputs,
      }),
    });

    await engine.execute();

    expect(repository.getMockData().workflowRuns[runId].status).toBe(
      WorkflowStatus.COMPLETED
    );

    expect(
      repository.getMockData().stepRuns[createStepRunId(runId, "step1")].output
    ).toEqual({ greetings: "Hello bar" });
  });
});

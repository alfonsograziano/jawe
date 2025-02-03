import { StepRun, WorkflowRun, TriggerRun } from "@prisma/client";
import { Step, Trigger, WorkflowTemplate } from "../validateTemplate";

type CompleteWorkflow = WorkflowRun & { stepRuns: StepRun[] };

export const createStepRunId = (runId: string, stepId: string) =>
  `${runId}-${stepId}`;

export const stepRuns: Record<string, StepRun> = {};

export const baseTriggerRun = {
  id: "base-trigger-run-with-empty-output",
  output: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  triggerId: "fake-trigger-id",
  workflowRunId: null,
};

export const triggerRunWithOutputs = {
  id: "rigger-run-with-output",
  output: {
    foo: "bar",
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  triggerId: "fake-trigger-id",
  workflowRunId: null,
};

export const createRun = (overrides?: {}): CompleteWorkflow => {
  return {
    id: "run1",
    triggerRunId: baseTriggerRun.id,
    templateId: "template1",
    status: "PENDING",
    createdAt: new Date(),
    startTime: new Date(),
    updatedAt: new Date(),
    endTime: new Date(),
    stepRuns: [],
    ...overrides,
  };
};

export const workflowRuns: Record<string, CompleteWorkflow> = {
  run1: createRun({ id: "run1" }),
  run1WithConditionals: createRun({ id: "run1WithConditionals" }),
  run1WithInputs: createRun({ id: "run1WithInputs" }),
  run1Parallel: createRun({ id: "run1Parallel" }),
  run2Parallel: createRun({ id: "run2Parallel" }),
  runWithFailureInjection: createRun({ id: "runWithFailureInjection" }),
  runWithParallelAndFailure: createRun({ id: "runWithFailureInjection" }),
  runWithInputTrigger: createRun({
    id: "runWithInputTrigger",
    triggerRunId: triggerRunWithOutputs.id,
  }),
};

const basicVisualizationMetadata = {
  position: {
    x: 1,
    y: 1,
  },
  data: {
    label: "Basic label",
  },
};

export const createTrigger = (overrides = {}): Trigger => {
  return {
    id: "trigger1",
    isEnabled: true,
    inputs: {},
    isConfigured: true,
    type: "webhook",
    visualizationMetadata: basicVisualizationMetadata,
    ...overrides,
  };
};

const stepTypes = {
  base: "example-plugin",
  injectFailure: "inject-failure",
  conditional: "conditional",
  sayHello: "say-hello-plugin",
  helloWorld: "hello-world",
  wait: "wait",
};

export const createStep = (overrides = {}): Step => {
  return {
    id: "step1",
    name: "Step",
    inputs: {},
    isConfigured: true,
    type: stepTypes.base,
    visualizationMetadata: basicVisualizationMetadata,
    ...overrides,
  };
};

export const mockBasicWorkflowTemplate: WorkflowTemplate = {
  entryPointId: "step1",
  name: "T1",
  status: "PUBLISHED",
  triggers: [createTrigger()],
  steps: [createStep(), createStep({ id: "step2" })],
  connections: [
    { fromStepId: "step1", toStepId: "step2", id: "step1-step2-conn" },
  ],
};

export const mockWTWithFailureInjected: WorkflowTemplate = {
  entryPointId: "step1",
  name: "T1",
  status: "PUBLISHED",
  triggers: [createTrigger()],
  steps: [
    createStep({ type: stepTypes.injectFailure }),
    createStep({ id: "step2" }),
  ],
  connections: [
    { fromStepId: "step1", toStepId: "step2", id: "step1-step2-conn" },
  ],
};

export const mockWorkflowTemplateWithConditionalPlugin: WorkflowTemplate = {
  entryPointId: "step1",
  name: "T1",
  status: "PUBLISHED",
  triggers: [createTrigger()],
  steps: [
    createStep({
      inputs: {
        targetStepId: "step2",
      },
      type: stepTypes.conditional,
    }),
    createStep({ id: "step2" }),
    createStep({ id: "step3" }),
  ],
  connections: [
    { fromStepId: "step1", toStepId: "step2", id: "step1-step2-conn" },
    { fromStepId: "step1", toStepId: "step3", id: "step1-step3-conn" },
  ],
};

export const mockWorkflowTemplateWithInputs: WorkflowTemplate = {
  entryPointId: "step1",
  name: "T1",
  status: "PUBLISHED",
  triggers: [createTrigger()],
  steps: [
    createStep({ type: stepTypes.sayHello }),
    createStep({
      id: "step2",
      inputs: {
        name: {
          inputSource: "step_output",
          stepDetails: {
            stepId: "step1",
            outputPath: "hello",
          },
        },
      },
      type: stepTypes.helloWorld,
    }),
  ],
  connections: [
    { fromStepId: "step1", toStepId: "step2", id: "step1-step2-conn" },
  ],
};

export const mockWTWithParallelExecution: WorkflowTemplate = {
  entryPointId: "step1",
  name: "T1",
  status: "PUBLISHED",
  triggers: [createTrigger()],
  steps: [
    createStep(),
    createStep({ id: "step2" }),
    createStep({ id: "step3" }),
  ],
  connections: [
    { fromStepId: "step1", toStepId: "step2", id: "step1-step2-conn" },
    { fromStepId: "step1", toStepId: "step3", id: "step1-step2-conn" },
  ],
};

export const mockWTWithParallelExecutionAndConvergentStep: WorkflowTemplate = {
  entryPointId: "step1",
  name: "T1",
  status: "PUBLISHED",
  triggers: [createTrigger()],
  steps: [
    createStep(),
    createStep({
      id: "step2",
      inputs: {
        milliseconds: 1,
      },
      type: stepTypes.wait,
    }),
    createStep({
      id: "step3",
      inputs: {
        milliseconds: 1,
      },
      type: stepTypes.wait,
    }),
    createStep({ id: "step4" }),
  ],
  connections: [
    { fromStepId: "step1", toStepId: "step2", id: "step1-step2-conn" },
    { fromStepId: "step1", toStepId: "step3", id: "step1-step2-conn" },
    { fromStepId: "step2", toStepId: "step4", id: "step2-step4-conn" },
    { fromStepId: "step3", toStepId: "step4", id: "step3-step4-conn" },
  ],
};

export const mockWTWithInputFromTrigger: WorkflowTemplate = {
  entryPointId: "step1",
  name: "T1",
  status: "PUBLISHED",
  triggers: [createTrigger()],
  steps: [
    createStep({
      inputs: {
        name: {
          inputSource: "trigger_output",
          triggerDetails: {
            outputPath: "foo",
          },
        },
      },
      type: stepTypes.helloWorld,
    }),
  ],
  connections: [],
};

export const mockWTWithParallelExecutionAndFaiure: WorkflowTemplate = {
  entryPointId: "step1",
  name: "T1",
  status: "PUBLISHED",
  triggers: [createTrigger()],
  steps: [
    createStep(),
    createStep({ id: "step2", type: stepTypes.injectFailure }),
    createStep({ id: "step3" }),
    createStep({ id: "step4" }),
  ],
  connections: [
    { fromStepId: "step1", toStepId: "step2", id: "step1-step2-conn" },
    { fromStepId: "step1", toStepId: "step3", id: "step1-step2-conn" },
    { fromStepId: "step3", toStepId: "step4", id: "step3-step4-conn" },
  ],
};

export const mockWorkflowTemplateWithStaticInputs: WorkflowTemplate = {
  entryPointId: "step1",
  name: "T1",
  status: "PUBLISHED",
  triggers: [
    {
      id: "trigger1",
      isEnabled: true,
      inputs: {},
      isConfigured: true,
      type: "webhook",
      visualizationMetadata: basicVisualizationMetadata,
    },
  ],
  steps: [
    {
      id: "step1",
      name: "Step 1",
      inputs: {
        name: {
          inputSource: "static_value",
          staticValue: "pippo",
        },
      },
      isConfigured: true,
      type: "hello-world",
      visualizationMetadata: basicVisualizationMetadata,
    },
  ],
  connections: [],
};

export const buildWorkflowRun = ({
  runId,
  triggerRun,
  stepRuns,
}: {
  runId: string;
  triggerRun: TriggerRun;
  stepRuns?: StepRun[];
}) => {
  return {
    id: runId,
    triggerRun,
    stepRuns: stepRuns || [],
  };
};

export const buildMockData = () => ({
  stepRuns: structuredClone(stepRuns),
  workflowRuns: structuredClone(workflowRuns),
  mockBasicWorkflowTemplate: structuredClone(mockBasicWorkflowTemplate),
  mockWorkflowTemplateWithConditionalPlugin: structuredClone(
    mockWorkflowTemplateWithConditionalPlugin
  ),
  mockWorkflowTemplateWithInputs: structuredClone(
    mockWorkflowTemplateWithInputs
  ),
  mockWTWithParallelExecution: structuredClone(mockWTWithParallelExecution),
  mockWTWithParallelExecutionAndConvergentStep: structuredClone(
    mockWTWithParallelExecutionAndConvergentStep
  ),
  mockWTWithFailureInjected: structuredClone(mockWTWithFailureInjected),
  mockWTWithParallelExecutionAndFaiure: structuredClone(
    mockWTWithParallelExecutionAndFaiure
  ),
  mockWorkflowTemplateWithStaticInputs: structuredClone(
    mockWorkflowTemplateWithStaticInputs
  ),
  mockWTWithInputFromTrigger: structuredClone(mockWTWithInputFromTrigger),
});

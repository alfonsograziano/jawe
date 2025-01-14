import { StepRun, WorkflowRun } from "@prisma/client";
import { WorkflowTemplate } from "../validateTemplate";

type CompleteWorkflow = WorkflowRun & { stepRuns: StepRun[] };

export const createStepRunId = (runId: string, stepId: string) =>
  `${runId}-${stepId}`;

export const stepRuns: Record<string, StepRun> = {};

export const workflowRuns: Record<string, CompleteWorkflow> = {
  run1: {
    id: "run1",
    templateId: "template1",
    status: "PENDING",
    createdAt: new Date(),
    startTime: new Date(),
    updatedAt: new Date(),
    endTime: new Date(),
    stepRuns: [],
  },
  run1WithConditionals: {
    id: "run1WithConditionals",
    templateId: "template1",
    status: "PENDING",
    createdAt: new Date(),
    startTime: new Date(),
    updatedAt: new Date(),
    endTime: new Date(),
    stepRuns: [],
  },
  run1WithInputs: {
    id: "run1WithInputs",
    templateId: "template1",
    status: "PENDING",
    createdAt: new Date(),
    startTime: new Date(),
    updatedAt: new Date(),
    endTime: new Date(),
    stepRuns: [],
  },
  run1Parallel: {
    id: "run1Parallel",
    templateId: "template1",
    status: "PENDING",
    createdAt: new Date(),
    startTime: new Date(),
    updatedAt: new Date(),
    endTime: new Date(),
    stepRuns: [],
  },
  run2Parallel: {
    id: "run2Parallel",
    templateId: "template1",
    status: "PENDING",
    createdAt: new Date(),
    startTime: new Date(),
    updatedAt: new Date(),
    endTime: new Date(),
    stepRuns: [],
  },
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

export const mockBasicWorkflowTemplate: WorkflowTemplate = {
  entryPointId: "step1",
  name: "T1",
  status: "PUBLISHED",
  triggers: [
    {
      id: "trigger1",
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
      inputs: {},
      isConfigured: true,
      type: "example-plugin",
      visualizationMetadata: basicVisualizationMetadata,
    },
    {
      id: "step2",
      name: "Step 2",
      inputs: {},
      isConfigured: true,
      type: "example-plugin",
      visualizationMetadata: basicVisualizationMetadata,
    },
  ],
  connections: [
    { fromStepId: "step1", toStepId: "step2", id: "step1-step2-conn" },
  ],
};

export const mockWorkflowTemplateWithConditionalPlugin: WorkflowTemplate = {
  entryPointId: "step1",
  name: "T1",
  status: "PUBLISHED",
  triggers: [
    {
      id: "trigger1",
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
        targetStepId: "step2",
      },
      isConfigured: true,
      type: "conditional",
      visualizationMetadata: basicVisualizationMetadata,
    },
    {
      id: "step2",
      name: "Step 2",
      inputs: {},
      isConfigured: true,
      type: "example-plugin",
      visualizationMetadata: basicVisualizationMetadata,
    },
    {
      id: "step3",
      name: "Step 3",
      inputs: {},
      isConfigured: true,
      type: "example-plugin",
      visualizationMetadata: basicVisualizationMetadata,
    },
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
  triggers: [
    {
      id: "trigger1",
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
      inputs: {},
      isConfigured: true,
      type: "say-hello-plugin",
      visualizationMetadata: basicVisualizationMetadata,
    },
    {
      id: "step2",
      name: "Step 2",
      inputs: {
        name: {
          inputSource: "step_output",
          stepDetails: {
            stepId: "step1",
            outputPath: "hello",
          },
        },
      },
      isConfigured: true,
      type: "hello-world",
      visualizationMetadata: basicVisualizationMetadata,
    },
  ],
  connections: [
    { fromStepId: "step1", toStepId: "step2", id: "step1-step2-conn" },
  ],
};

export const mockWTWithParallelExecution: WorkflowTemplate = {
  entryPointId: "step1",
  name: "T1",
  status: "PUBLISHED",
  triggers: [
    {
      id: "trigger1",
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
      inputs: {},
      isConfigured: true,
      type: "example-plugin",
      visualizationMetadata: basicVisualizationMetadata,
    },
    {
      id: "step2",
      name: "Step 2",
      inputs: {},
      isConfigured: true,
      type: "example-plugin",
      visualizationMetadata: basicVisualizationMetadata,
    },
    {
      id: "step3",
      name: "Step 3",
      inputs: {},
      isConfigured: true,
      type: "example-plugin",
      visualizationMetadata: basicVisualizationMetadata,
    },
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
  triggers: [
    {
      id: "trigger1",
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
      inputs: {},
      isConfigured: true,
      type: "example-plugin",
      visualizationMetadata: basicVisualizationMetadata,
    },
    {
      id: "step2",
      name: "Step 2",
      inputs: {
        milliseconds: 20,
      },
      isConfigured: true,
      type: "wait",
      visualizationMetadata: basicVisualizationMetadata,
    },
    {
      id: "step3",
      name: "Step 3",
      inputs: {
        milliseconds: 50,
      },
      isConfigured: true,
      type: "wait",
      visualizationMetadata: basicVisualizationMetadata,
    },
    {
      id: "step4",
      name: "Step 4",
      inputs: {},
      isConfigured: true,
      type: "example-plugin",
      visualizationMetadata: basicVisualizationMetadata,
    },
  ],
  connections: [
    { fromStepId: "step1", toStepId: "step2", id: "step1-step2-conn" },
    { fromStepId: "step1", toStepId: "step3", id: "step1-step2-conn" },
    { fromStepId: "step2", toStepId: "step4", id: "step2-step4-conn" },
    { fromStepId: "step3", toStepId: "step4", id: "step3-step4-conn" },
  ],
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
});

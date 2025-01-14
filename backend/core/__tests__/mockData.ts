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
});

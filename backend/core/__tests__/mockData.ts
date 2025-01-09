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
      type: "hello-world",
      visualizationMetadata: basicVisualizationMetadata,
    },
    {
      id: "step2",
      name: "Step 2",
      inputs: {},
      isConfigured: true,
      type: "hello-world",
      visualizationMetadata: basicVisualizationMetadata,
    },
  ],
  connections: [
    { fromStepId: "step1", toStepId: "step2", id: "step1-step2-conn" },
  ],
};

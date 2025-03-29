import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const VisualizationMetadata = Type.Object({
  position: Type.Object({
    x: Type.Number(),
    y: Type.Number(),
  }),
  data: Type.Object({
    label: Type.String(),
  }),
});

export const StepConnections = Type.Object({
  id: Type.String(),
  fromStepId: Type.String(),
  toStepId: Type.String(),
});

export const Trigger = Type.Object({
  id: Type.String(),
  type: Type.String(),
  inputs: Type.Any(),
  visualizationMetadata: VisualizationMetadata,
  isConfigured: Type.Boolean(),
  isEnabled: Type.Boolean(),
});

export const TriggerInputOnly = Type.Omit(Trigger, ["isConfigured"]);

export const Step = Type.Object({
  id: Type.String(),
  name: Type.String(),
  type: Type.String(),
  inputs: Type.Optional(Type.Any()),
  visualizationMetadata: VisualizationMetadata,
  isConfigured: Type.Boolean(),
});

export const StepRun = Type.Object({
  id: Type.String(),
  stepId: Type.String(),
  runId: Type.String(),
  inputs: Type.Optional(Type.Any()),
});

export type Step = Static<typeof Step>;

export const StepInputOnly = Type.Omit(Step, ["isConfigured"]);

export const TemplateStatus = Type.Union([
  Type.Literal("DRAFT"),
  Type.Literal("PUBLISHED"),
]);

export const WorkflowTemplate = Type.Object({
  name: Type.String(),
  steps: Type.Array(Step),
  connections: Type.Array(StepConnections),
  entryPointId: Type.String(),
  status: TemplateStatus,
  triggers: Type.Array(Trigger),
});

export type Trigger = Static<typeof Trigger>;

export type WorkflowTemplate = Static<typeof WorkflowTemplate>;

export type VisualizationMetadataType = Static<typeof VisualizationMetadata>;

export function validateVisualizationMetadata(
  metadata: any
): VisualizationMetadataType {
  if (Value.Check(VisualizationMetadata, metadata)) {
    return metadata;
  }

  throw new Error("Cannot validate visual metadata");
}

export function validateTemplate(template: any) {
  validateTemplateStructure(template);
  validateEntryPoint(template);
  validateConnections(template);
  validateTriggers(template);
  validateSteps(template);
  return true;
}

function validateTemplateStructure(template: any) {
  if (!Value.Check(WorkflowTemplate, template)) {
    throw new Error("Template structure is invalid");
  }
}

export function validateEntryPoint(template: any) {
  const stepIds = new Set(template.steps.map((step: any) => step.id));

  if (!stepIds.has(template.entryPointId)) {
    throw new Error("Entry point ID must refer to an existing step");
  }

  const entryPointTargets = template.connections.filter(
    (conn: any) => conn.toStepId === template.entryPointId
  );
  if (entryPointTargets.length > 0) {
    throw new Error("Entry point must not be a target of any connection");
  }
}

export function validateConnections(template: any) {
  const adjacencyList = new Map();
  template.connections.forEach((conn: any) => {
    if (!adjacencyList.has(conn.fromStepId)) {
      adjacencyList.set(conn.fromStepId, []);
    }
    adjacencyList.get(conn.fromStepId).push(conn.toStepId);
  });

  const stepIds = new Set<string>(template.steps.map((step: any) => step.id));
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(node: string, visited: Set<string>): boolean {
    if (!visited.has(node)) {
      visited.add(node);
      recStack.add(node);

      const neighbors = adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && hasCycle(neighbor, visited)) {
          return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }
    }
    recStack.delete(node);
    return false;
  }

  for (const node of stepIds) {
    if (hasCycle(node, visited)) {
      throw new Error("Workflow connections must form a valid DAG");
    }
  }

  const reachableSteps = new Set<string>();
  function dfs(node: string) {
    if (!reachableSteps.has(node)) {
      reachableSteps.add(node);
      const neighbors = adjacencyList.get(node) || [];
      neighbors.forEach(dfs);
    }
  }

  dfs(template.entryPointId);

  if (reachableSteps.size !== stepIds.size) {
    throw new Error("All steps must be connected to the workflow");
  }
}

export function validateTriggers(template: any) {
  if (!template.triggers || template.triggers.length === 0) {
    throw new Error("At least one trigger is required for the workflow");
  }

  template.triggers.forEach((trigger: any) => {
    validateVisualizationMetadata(trigger.visualizationMetadata);
  });
}

export function validateSteps(template: any) {
  template.steps.forEach((step: any) => {
    validateVisualizationMetadata(step.visualizationMetadata);
    if (!step.inputs) {
      throw new Error(`Step ${step.id} is missing required inputs`);
    }
  });
}

export function canTemplateBePublished(template: any) {
  try {
    validateTemplate(template);
  } catch (e) {
    return false;
  }

  for (const trigger of template.triggers) {
    if (!trigger.isConfigured) return false;
  }

  for (const step of template.steps) {
    if (!step.isConfigured) return false;
  }

  return true;
}

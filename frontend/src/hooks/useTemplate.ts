import { useEffect, useMemo, useState } from "react";
import { Client, WorkflowTemplate } from "../client";
import { Connection, Position } from "@xyflow/react";

export const deleteStepInTemplate = (
  template: WorkflowTemplate,
  stepId: string
) => {
  const newTemplate = structuredClone(template);

  newTemplate.steps =
    newTemplate.steps && newTemplate.steps.filter((step) => step.id !== stepId);

  return newTemplate;
};

export const addConnection = (
  template: WorkflowTemplate,
  connection: Connection
) => {
  const newTemplate = structuredClone(template);

  const newConnection = {
    id: crypto.randomUUID(),
    fromStepId: connection.source,
    toStepId: connection.target,
  };

  if (newTemplate.connections && newTemplate.connections.length > 0) {
    newTemplate.connections.push(newConnection);
  } else {
    newTemplate.connections = [newConnection];
  }

  return newTemplate;
};

type StepPosition = {
  id: string;
  position: {
    x: number;
    y: number;
  };
};

const updateStepPositionInTemplate = (
  template: WorkflowTemplate,
  plugin: {
    id: string;
    position: {
      x: number;
      y: number;
    };
  }
) => {
  const newTemplate = structuredClone(template);

  const step =
    newTemplate.steps &&
    newTemplate.steps.length > 0 &&
    newTemplate.steps.find((step) => step.id === plugin.id);

  if (step) {
    step.visualizationMetadata = {
      ...(step.visualizationMetadata as {}),
      position: plugin.position,
    };

    return newTemplate;
  }

  return newTemplate;
};

type PluginBasicInfo = { id: string; name: string };

export const addNewStepToTemplate = (
  template: WorkflowTemplate,
  plugin: PluginBasicInfo
) => {
  const newTemplate = structuredClone(template);

  const newStep = {
    id: crypto.randomUUID(),
    name: plugin.name,
    type: plugin.id,
    inputs: {},
    visualizationMetadata: {
      position: { x: 500, y: 500 },
      data: { label: plugin.name },
    },
  };

  if (!newTemplate.steps) newTemplate.steps = [];
  newTemplate.steps.push(newStep);

  if (!newTemplate.entryPointId) {
    newTemplate.entryPointId = newStep.id;
  }

  return newTemplate;
};

export const getNodesAndEdgesFromTemplate = (data: WorkflowTemplate) => {
  const targetNodes = [];

  if (data?.steps) {
    targetNodes.push(...data.steps);
  }

  const nodes = targetNodes.map((step) => {
    const metadata = step.visualizationMetadata as {
      position: {
        x: number;
        y: number;
      };
      data: {
        label: string;
      };
    };

    const node = {
      id: step.id,
      position: metadata.position,
      type: "node-with-toolbar",
      data: {
        ...metadata.data,
        forceToolbarVisible: false,
        toolbarPosition: Position.Left,
        isEntryPoint: step.id === data.entryPointId,
      },
    };

    return node;
  });

  const edges =
    data?.connections?.map((connection) => ({
      id: connection.id,
      source: connection.fromStepId,
      target: connection.toStepId,
    })) || [];

  return {
    nodes,
    edges,
  };
};

export const useTemplate = (templateId: string) => {
  const [savedTemplate, setSavedTemplate] = useState<
    WorkflowTemplate | undefined
  >();

  const [template, setTemplate] = useState<WorkflowTemplate | undefined>();

  useEffect(() => {
    const client = new Client();
    client.loadTemplateDetails(templateId).then((res) => {
      setTemplate(res.data);
      setSavedTemplate(res.data);
    });
  }, [templateId]);

  const graphInfo = useMemo(() => {
    if (!template)
      return {
        nodes: [],
        edges: [],
      };
    return getNodesAndEdgesFromTemplate(template);
  }, [template]);

  const isOutOfSync = useMemo(() => {
    return JSON.stringify(template) !== JSON.stringify(savedTemplate);
  }, [template, savedTemplate]);

  return {
    template,
    setTemplate,
    deleteStep: (stepId: string) => {
      if (!template) return;
      setTemplate(deleteStepInTemplate(template, stepId));
    },
    updateStepPosition: (step: StepPosition) => {
      if (!template) return;
      setTemplate(updateStepPositionInTemplate(template, step));
    },
    addConnection: (connection: Connection) => {
      if (!template) return;
      setTemplate(addConnection(template, connection));
    },
    addStep: (step: PluginBasicInfo) => {
      if (!template) return;
      setTemplate(addNewStepToTemplate(template, step));
    },
    isOutOfSync,
    graphInfo,
    saveTemplate: () => {},
    deleteTemplate: async () => {
      if (!template) return;
      return new Client().deleteTemplate(template.id);
    },
  };
};

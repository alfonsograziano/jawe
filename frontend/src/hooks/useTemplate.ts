import { useEffect, useMemo, useState } from "react";
import { Client, WorkflowTemplate } from "../client";
import { Connection, Position } from "@xyflow/react";

export const deleteStepInTemplate = (
  template: WorkflowTemplate,
  stepId: string
) => {
  const newTemplate = structuredClone(template);

  // Remove the step
  newTemplate.steps =
    newTemplate.steps && newTemplate.steps.filter((step) => step.id !== stepId);

  // Remove step connections related to the step
  newTemplate.connections =
    newTemplate.connections &&
    newTemplate.connections.filter(
      (connection) =>
        connection.fromStepId !== stepId && connection.toStepId !== stepId
    );

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
      ...step.visualizationMetadata,
      position: plugin.position,
    };

    return newTemplate;
  }

  const trigger =
    newTemplate.triggers &&
    newTemplate.triggers.length > 0 &&
    newTemplate.triggers.find((trigger) => trigger.id === plugin.id);

  if (trigger) {
    trigger.visualizationMetadata = {
      ...trigger.visualizationMetadata,
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

    let nodeType = "node-with-toolbar";
    if (step.id === data.entryPointId) nodeType = "entry-point-with-toolbar";

    const node = {
      id: step.id,
      position: metadata.position,
      type: nodeType,
      data: {
        ...metadata.data,
        forceToolbarVisible: false,
        toolbarPosition: Position.Left,
      },
    };

    return node;
  });

  data.triggers.forEach((trigger) => {
    const metadata = trigger.visualizationMetadata as {
      position: {
        x: number;
        y: number;
      };
      data: {
        label: string;
      };
    };

    let nodeType = "trigger-with-toolbar";

    nodes.push({
      id: trigger.id,
      position: metadata.position,
      type: nodeType,
      data: {
        ...metadata.data,
        forceToolbarVisible: false,
        toolbarPosition: Position.Left,
      },
    });
  });

  const edges =
    data?.connections?.map((connection) => ({
      id: connection.id,
      source: connection.fromStepId,
      target: connection.toStepId,
    })) || [];

  if (data.entryPointId) {
    data.triggers.forEach((trigger) => {
      edges.push({
        id: trigger.id,
        source: trigger.id,
        target: data.entryPointId as string,
      });
    });
  }

  return {
    nodes,
    edges,
  };
};

export const addTriggerToTemplate = (
  template: WorkflowTemplate,
  trigger: {
    id: string;
    name: string;
  }
) => {
  const newTemplate = structuredClone(template);

  const newTrigger = {
    id: trigger.id,
    type: trigger.name,
    settings: {},
    visualizationMetadata: {
      position: { x: 500, y: 500 },
      data: { label: trigger.name },
    },
  };

  if (!newTemplate.triggers) newTemplate.triggers = [];
  newTemplate.triggers.push(newTrigger);

  return newTemplate;
};

export const deleteTriggerFromTemplate = (
  template: WorkflowTemplate,
  triggerId: string
) => {
  const newTemplate = structuredClone(template);

  newTemplate.triggers =
    newTemplate.triggers &&
    newTemplate.triggers.filter((t) => t.id !== triggerId);

  return newTemplate;
};

export const removeConnectionsFromTemplate = (
  template: WorkflowTemplate,
  connectionIds: string[]
) => {
  // Create a deep copy of the template
  const newTemplate = structuredClone(template);

  // Filter out connections whose IDs are in the connectionIds array
  newTemplate.connections =
    newTemplate.connections &&
    newTemplate.connections.filter((t) => !connectionIds.includes(t.id));

  return newTemplate;
};

export const useTemplate = (templateId: string) => {
  const [savedTemplate, setSavedTemplate] = useState<
    WorkflowTemplate | undefined
  >();

  const [template, setTemplate] = useState<WorkflowTemplate | undefined>();

  const fetchTemplate = async () => {
    const client = new Client();
    const { data } = await client.loadTemplateDetails(templateId);

    setTemplate(data);
    setSavedTemplate(data);
  };

  useEffect(() => {
    fetchTemplate();
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
    saveTemplate: async (refetch = true) => {
      if (!template) return;
      const client = new Client();
      const { data, error } = await client.updateTemplate(
        template.id,
        template
      );
      if (refetch && typeof error === "undefined") await fetchTemplate();
      return { data, error };
    },
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
    deleteTemplate: async () => {
      if (!template) return;
      return new Client().deleteTemplate(template.id);
    },
    addTrigger: (trigger: { id: string; name: string }) => {
      if (!template) return;
      setTemplate(addTriggerToTemplate(template, trigger));
    },
    deleteTrigger: (triggerId: string) => {
      if (!template) return;
      setTemplate(deleteTriggerFromTemplate(template, triggerId));
    },
    publishTemplate: async () => {
      if (!template) return;
      const { data, error } = await new Client().publishTemplate(template.id);
      if (typeof error === "undefined") await fetchTemplate();
      return { data, error };
    },
    removeConnections: (connections: string[]) => {
      if (!template) return;
      setTemplate(removeConnectionsFromTemplate(template, connections));
    },
  };
};

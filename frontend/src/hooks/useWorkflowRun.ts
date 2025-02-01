import { useEffect, useMemo, useState } from "react";
import { Client, WorkflowRunData } from "../client";
import { Position } from "@xyflow/react";

export const nodeStyleBasedOnStatus = {
  PENDING: {
    borderColor: "gray",
    borderWidth: "1px",
  },
  RUNNING: {
    borderColor: "orange",
    borderWidth: "1.5px",
  },
  COMPLETED: {
    borderColor: "green",
    borderWidth: "1.5px",
  },
  FAILED: {
    borderColor: "red",
    borderWidth: "2px",
  },
};

type StepStatus = keyof typeof nodeStyleBasedOnStatus;

export const getNodesAndEdgesFromTemplate = (data: WorkflowRunData) => {
  const targetNodes = [];
  const steps = data.template.steps;

  targetNodes.push(...steps);

  const nodes = targetNodes.map((step) => {
    const stepRun = data.stepRuns.find((stepRun) => stepRun.stepId === step.id);
    const stepStatus: StepStatus = stepRun?.status ? stepRun.status : "PENDING";

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
    if (step.id === data.template.entryPointId)
      nodeType = "entry-point-with-toolbar";

    const node = {
      id: step.id,
      executionRunId: stepRun?.id,
      position: metadata.position,
      type: nodeType,
      style: nodeStyleBasedOnStatus[stepStatus],
      data: {
        ...metadata.data,
        forceToolbarVisible: false,
        toolbarPosition: Position.Left,
      },
    };

    return node;
  });

  // TODO: Implement triggerRun and link it
  data.template.triggers.forEach((trigger) => {
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

    const isTriggerExecuted = data.triggerRun.triggerId === trigger.id;

    nodes.push({
      id: trigger.id,
      executionRunId: isTriggerExecuted ? data.triggerRun.id : undefined,
      position: metadata.position,
      type: nodeType,
      style: {
        borderColor: isTriggerExecuted ? "green" : "black",
        borderWidth: isTriggerExecuted ? "1.5px" : "1px",
      },
      data: {
        ...metadata.data,
        forceToolbarVisible: false,
        toolbarPosition: Position.Left,
      },
    });
  });

  const edges =
    data.template.connections?.map((connection) => ({
      id: connection.id,
      source: connection.fromStepId,
      target: connection.toStepId,
    })) || [];

  if (data.template.entryPointId) {
    data.template.triggers.forEach((trigger) => {
      edges.push({
        id: trigger.id,
        source: trigger.id,
        target: data.template.entryPointId as string,
      });
    });
  }

  return {
    nodes,
    edges,
  };
};

export const useWorkflowRun = (runId: string) => {
  const [runData, setRunData] = useState<WorkflowRunData | undefined>();

  const fetchTemplate = async () => {
    const client = new Client();
    const { data } = await client.getRunDetails(runId);

    setRunData(data);
  };

  useEffect(() => {
    fetchTemplate();
  }, [runId]);

  const graphInfo = useMemo(() => {
    if (!runData)
      return {
        nodes: [],
        edges: [],
      };
    return getNodesAndEdgesFromTemplate(runData);
  }, [runData]);

  return {
    runData,
    graphInfo,
  };
};

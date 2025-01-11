import { useParams } from "react-router-dom";
import { useWorkflowRun } from "../hooks/useWorkflowRun";
import NodeWithToolbar from "../components/NodeWithToolbar";
import EntryPointWithToolbar from "../components/EntryPointNode";
import TriggerWithToolbar from "../components/TriggerWithToolbar";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useEffect } from "react";
import BackButton from "../components/Back";
import { Descriptions, Tag } from "antd";

export const nodeStyleBasedOnStatus = {
  PENDING: {
    borderColor: "gray",
    borderWidth: "1px",
    color: "default",
  },
  RUNNING: {
    borderColor: "orange",
    borderWidth: "1.5px",
    color: "orange",
  },
  COMPLETED: {
    borderColor: "green",
    borderWidth: "1.5px",
    color: "green",
  },
  FAILED: {
    borderColor: "red",
    borderWidth: "2px",
    color: "red",
  },
};

const nodeTypes = {
  "node-with-toolbar": NodeWithToolbar,
  "entry-point-with-toolbar": EntryPointWithToolbar,
  "trigger-with-toolbar": TriggerWithToolbar,
};

const WorkflowRunDetailsPage = () => {
  const { id: workflowTemplateId, runId } = useParams();
  if (!workflowTemplateId || !runId) return <p>You need to add an ID...</p>;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  const { runData, graphInfo } = useWorkflowRun(runId);

  useEffect(() => {
    const { nodes: formattedNodes, edges: formattedEdges } = graphInfo;

    const nodesWithActions = formattedNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onOpenDetails: async () => {},
      },
    }));
    setNodes(nodesWithActions as any);
    setEdges(formattedEdges as any);
  }, [graphInfo, runData]);

  console.log({ runData, graphInfo });

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#000",
          },
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        onNodesChange={onNodesChange}
        onEdgesChange={() => {}}
        onConnect={() => {}}
        onEdgesDelete={() => {}}
      >
        <Panel>
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <BackButton />
            </div>
          </div>
        </Panel>
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
      {runData && (
        <div
          style={{
            height: "100%",
            width: "50%",
            minWidth: "400px",
          }}
        >
          <Descriptions
            title="Run Details"
            bordered
            column={1}
            style={{ padding: "10px" }}
          >
            <Descriptions.Item label="Run ID">{runData.id}</Descriptions.Item>
            <Descriptions.Item label="Start Time">
              {new Date(runData.startTime).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="End Time">
              {runData.endTime
                ? new Date(runData.endTime).toLocaleString()
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={nodeStyleBasedOnStatus[runData.status].color}>
                {runData.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Template Name">
              {runData.template.name}
            </Descriptions.Item>
          </Descriptions>
        </div>
      )}
    </div>
  );
};

export default WorkflowRunDetailsPage;

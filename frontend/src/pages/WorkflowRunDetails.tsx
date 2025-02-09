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
import { useEffect, useState } from "react";
import BackButton from "../components/Back";
import { Descriptions, Splitter } from "antd";
import { WorkflowRunStepData } from "../client";
import StepRunInfoDrawer from "../components/StepRunInfoDrawer";
import { StatusTag } from "../components/StatusTag";
import TriggerRunInfoDrawer from "../components/TriggerRunInfoDrawer";

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
  const [drawerStepInfo, setDrawerStepInfo] = useState<
    WorkflowRunStepData | undefined
  >();

  const [isDrawerTriggerRunOpen, setIsDrawerTriggerRunOpen] =
    useState<boolean>(false);

  useEffect(() => {
    const { nodes: formattedNodes, edges: formattedEdges } = graphInfo;

    const nodesWithActions = formattedNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onOpenDetails: async () => {
          if (runData?.triggerRun.id === node.executionRunId) {
            setIsDrawerTriggerRunOpen(true);
          }
          const stepRun = runData?.stepRuns.find(
            (stepRun) => node.executionRunId === stepRun.id
          );
          setDrawerStepInfo(stepRun);
        },
      },
    }));
    setNodes(nodesWithActions as any);
    setEdges(formattedEdges as any);
  }, [graphInfo, runData]);

  console.log({ runData, graphInfo });

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex" }}>
      <Splitter>
        <Splitter.Panel defaultSize="60%" min="20%" max="70%">
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
        </Splitter.Panel>
        <Splitter.Panel>
          {runData && (
            <div>
              <Descriptions
                title="Run Details"
                bordered
                column={1}
                style={{ padding: "10px" }}
              >
                <Descriptions.Item label="Run ID">
                  {runData.id}
                </Descriptions.Item>
                <Descriptions.Item label="Start Time">
                  {runData.startTime
                    ? new Date(runData.startTime).toLocaleString()
                    : "N/A"}{" "}
                </Descriptions.Item>
                <Descriptions.Item label="End Time">
                  {runData.endTime
                    ? new Date(runData.endTime).toLocaleString()
                    : "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <StatusTag status={runData.status} />
                </Descriptions.Item>
                <Descriptions.Item label="Template Name">
                  {runData.template.name}
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </Splitter.Panel>
      </Splitter>

      {drawerStepInfo && (
        <StepRunInfoDrawer
          onClose={() => {
            setDrawerStepInfo(undefined);
          }}
          open={typeof drawerStepInfo !== "undefined"}
          stepInfo={drawerStepInfo}
        />
      )}

      {runData?.triggerRun && (
        <TriggerRunInfoDrawer
          onClose={() => {
            setIsDrawerTriggerRunOpen(false);
          }}
          open={isDrawerTriggerRunOpen}
          triggerRunInfo={runData.triggerRun}
        />
      )}
    </div>
  );
};

export default WorkflowRunDetailsPage;

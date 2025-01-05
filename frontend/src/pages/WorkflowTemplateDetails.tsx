import { useEffect, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Connection,
  MarkerType,
  Panel,
} from "@xyflow/react";
import { useParams } from "react-router";
import "@xyflow/react/dist/style.css";
import { Client, WorkflowStep } from "../client";
import AddNewPlugin from "../components/AddNewPlugin";
import { Button, message, Typography } from "antd";
import BackButton from "../components/Back";
import { useNavigate } from "react-router-dom";
import NodeWithToolbar from "../components/NodeWithToolbar";
import { useTemplate } from "../hooks/useTemplate";
import StepInfoDrawer from "../components/StepInfoDrawer";
import AddNewTrigger from "../components/AddNewTrigger";
import EntryPointWithToolbar from "../components/EntryPointNode";
import TriggerWithToolbar from "../components/TriggerWithToolbar";

const { Title } = Typography;

const nodeTypes = {
  "node-with-toolbar": NodeWithToolbar,
  "entry-point-with-toolbar": EntryPointWithToolbar,
  "trigger-with-toolbar": TriggerWithToolbar,
};

export default function WorkflowTemplateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) return <p>You need to add an ID...</p>;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [drawerStepInfo, setDrawerStepInfo] = useState<
    WorkflowStep | undefined
  >();

  const {
    template,
    deleteStep,
    updateStepPosition,
    addStep,
    addConnection,
    graphInfo,
    isOutOfSync,
    deleteTemplate,
    addTrigger,
    deleteTrigger,
  } = useTemplate(id);

  useEffect(() => {
    const { nodes: formattedNodes, edges: formattedEdges } = graphInfo;

    const nodesWithActions = formattedNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onDelete: async () => {
          if (node.type === "node-with-toolbar" || "entry-point-with-toolbar") {
            deleteStep(node.id);
          }

          if (node.type === "trigger-with-toolbar") {
            deleteTrigger(node.id);
          }
        },
        onOpenDetails: async () => {
          setDrawerStepInfo(
            template?.steps?.find((step) => step.id === node.id)
          );
        },
      },
    }));
    setNodes(nodesWithActions as any);
    setEdges(formattedEdges as any);
  }, [graphInfo, template]);

  if (!template) return <p>Loading template...</p>;

  const saveTemplate = async () => {
    const client = new Client();
    const { data, error } = await client.updateTemplate(template?.id, template);
    if (data) message.success("Workflow template created 🎉");
    if (error) message.success("Error in updating the template...");
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={(changes) => {
          const change = changes[0] as {
            dragging: boolean;
            id: string;
            position: {
              x: number;
              y: number;
            };
            type: string;
          };
          if (!change.dragging && change.type === "position") {
            updateStepPosition(change);
          }
          onNodesChange(changes);
        }}
        onEdgesChange={onEdgesChange}
        onConnect={(params: Connection) => addConnection(params)}
        defaultEdgeOptions={{
          type: "floating",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#000",
          },
        }}
      >
        <Panel>
          <div style={{ display: "flex", gap: 20 }}>
            <BackButton />
            <Title level={3} style={{ margin: 0 }}>
              {template.name}
            </Title>
            <AddNewPlugin onSelect={addStep} />
            <AddNewTrigger onSelect={addTrigger} />

            <Button onClick={saveTemplate} type="primary">
              Save
            </Button>

            <Button
              color="danger"
              variant="solid"
              onClick={async () => {
                await deleteTemplate();
                navigate(-1);
              }}
            >
              Delete template
            </Button>
            {isOutOfSync && <p>You have unsaved changes...</p>}

            <StepInfoDrawer
              onClose={() => {
                setDrawerStepInfo(undefined);
              }}
              open={typeof drawerStepInfo !== "undefined"}
              stepInfo={drawerStepInfo}
            />
          </div>
        </Panel>
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

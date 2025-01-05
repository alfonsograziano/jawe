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
import { WorkflowStep } from "../client";
import AddNewPlugin from "../components/AddNewPlugin";
import { Button, Card, message, Popover, Input } from "antd";
import BackButton from "../components/Back";
import { useNavigate } from "react-router-dom";
import NodeWithToolbar from "../components/NodeWithToolbar";
import { useTemplate } from "../hooks/useTemplate";
import StepInfoDrawer from "../components/StepInfoDrawer";
import AddNewTrigger from "../components/AddNewTrigger";
import EntryPointWithToolbar from "../components/EntryPointNode";
import TriggerWithToolbar from "../components/TriggerWithToolbar";
import { DeleteOutlined, SaveOutlined } from "@ant-design/icons";

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
    removeConnections,
    graphInfo,
    isOutOfSync,
    deleteTemplate,
    addTrigger,
    deleteTrigger,
    saveTemplate,
    publishTemplate,
    editName,
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

  const saveTemplateAndShowFeedback = async () => {
    const result = await saveTemplate();
    if (!result) return;
    const { data, error } = result;
    if (data) message.success("Workflow template saved 🎉");
    if (error) message.error(error.error);
  };

  const publishTemplateAndShowFeedback = async () => {
    const result = await publishTemplate();
    if (!result) return;
    const { data, error } = result;
    if (data) message.success("Workflow template successfilly published 🎉");
    if (error) message.error(error.error);
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
        onEdgesDelete={(edges: { id: string }[]) =>
          removeConnections(edges.map((edge) => edge.id))
        }
      >
        <Panel>
          <div style={{ display: "flex", gap: 20 }}>
            <Card
              style={{ boxShadow: "0px 0px 10px #d3d3d3", margin: 4 }}
              styles={{ body: { margin: 10, padding: 0 } }}
            >
              <div style={{ display: "flex", gap: 20 }}>
                <BackButton />
                <Input
                  value={template.name}
                  onChange={(event) => editName(event.target.value)}
                />
              </div>
            </Card>

            <div style={{ position: "fixed", right: "20px", top: "20px" }}>
              {isOutOfSync && <p>You have unsaved changes...</p>}
            </div>

            <Card
              style={{
                position: "fixed",
                bottom: "20px",
                left: "60px",
                boxShadow: "0px 0px 10px #d3d3d3",
                margin: 4,
              }}
              styles={{ body: { margin: 10, padding: 0 } }}
            >
              <div style={{ display: "flex", gap: 20 }}>
                <AddNewPlugin onSelect={addStep} />
                <AddNewTrigger onSelect={addTrigger} />
                <Button
                  onClick={saveTemplateAndShowFeedback}
                  type="primary"
                  icon={<SaveOutlined />}
                >
                  Save
                </Button>
                <Popover content="Delete template">
                  <Button
                    color="danger"
                    variant="solid"
                    icon={<DeleteOutlined />}
                    onClick={async () => {
                      await deleteTemplate();
                      navigate(-1);
                    }}
                  />
                </Popover>

                {template.status === "DRAFT" && (
                  <Button onClick={publishTemplateAndShowFeedback}>
                    Publish
                  </Button>
                )}
              </div>
            </Card>

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

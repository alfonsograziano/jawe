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
import {
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import DeleteTemplate from "../components/DeleteTemplate";
import PublishTemplateButton from "../components/PublishTemplateButton";
import DuplicateButtonAndFeedback from "../components/DuplicateButtonAndFeedback";
import TriggerInfoDrawer from "../components/TriggerInfoDrawer";

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

  const [drawerTrigerInfo, setDrawerTriggerInfo] = useState<
    | {
        id: string;
        type: string;
        inputs: any;
      }
    | undefined
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
    history,
    duplicateTemplate,
    canEditTemplate,
    setTriggerInputs,
    setStepsInputs,
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
          if (node.type === "trigger-with-toolbar") {
            setDrawerTriggerInfo(
              template?.triggers?.find((triggers) => triggers.id === node.id)
            );
          }

          if (node.type === "node-with-toolbar" || "entry-point-with-toolbar") {
            setDrawerStepInfo(
              template?.steps?.find((step) => step.id === node.id)
            );
          }
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
        defaultEdgeOptions={{
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#000",
          },
        }}
        nodesDraggable={canEditTemplate}
        nodesConnectable={canEditTemplate}
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
        onEdgesChange={(changes) => {
          if (!canEditTemplate) return;
          onEdgesChange(changes);
        }}
        onConnect={(params: Connection) => {
          if (!canEditTemplate) return;
          addConnection(params);
        }}
        onEdgesDelete={(edges: { id: string }[]) => {
          if (!canEditTemplate) return;
          removeConnections(edges.map((edge) => edge.id));
        }}
      >
        <Panel>
          <div style={{ display: "flex", gap: 20 }}>
            <Card
              style={{ boxShadow: "0px 0px 10px #d3d3d3", margin: 4 }}
              styles={{ body: { margin: 10, padding: 0 } }}
            >
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <BackButton />
                <Input
                  value={template.name}
                  onChange={(event) => editName(event.target.value)}
                  disabled={!canEditTemplate}
                />

                {template.status === "DRAFT" && (
                  <PublishTemplateButton
                    onConfirmPublish={publishTemplateAndShowFeedback}
                  />
                )}

                {template.status === "PUBLISHED" && (
                  <Button
                    icon={<UnorderedListOutlined />}
                    onClick={() => navigate(`/workflow/${id}/runs`)}
                  >
                    View executions
                  </Button>
                )}
              </div>
            </Card>

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
                <AddNewTrigger
                  onSelect={addTrigger}
                  disabled={!canEditTemplate}
                />
                <AddNewPlugin onSelect={addStep} disabled={!canEditTemplate} />

                {isOutOfSync ? (
                  <Popover content="You have unsaved changes">
                    <Button
                      onClick={saveTemplateAndShowFeedback}
                      type="primary"
                      icon={<SaveOutlined />}
                      disabled={!canEditTemplate}
                    >
                      Save
                    </Button>
                  </Popover>
                ) : (
                  <Button
                    onClick={saveTemplateAndShowFeedback}
                    type="default"
                    icon={<SaveOutlined />}
                    disabled={!canEditTemplate}
                  >
                    Save
                  </Button>
                )}

                <div style={{ display: "flex", gap: 3 }}>
                  <Button
                    icon={<UndoOutlined />}
                    onClick={history.undo}
                    disabled={!history.canUndo || !canEditTemplate}
                  />

                  <Button
                    icon={<RedoOutlined />}
                    onClick={history.redo}
                    disabled={!history.canRedo || !canEditTemplate}
                  />
                </div>

                <DeleteTemplate
                  onConfirmDelete={async () => {
                    await deleteTemplate();
                    navigate(-1);
                  }}
                />

                <DuplicateButtonAndFeedback
                  duplicateTemplate={async () => {
                    //TODO: Refator this..
                    const result = await duplicateTemplate();
                    if (!result) return { id: undefined };
                    const { data } = result;
                    if (!data) return { id: undefined };
                    return { id: data.id };
                  }}
                />
              </div>
            </Card>

            {drawerStepInfo && (
              <StepInfoDrawer
                onClose={() => {
                  setDrawerStepInfo(undefined);
                }}
                open={typeof drawerStepInfo !== "undefined"}
                stepInfo={drawerStepInfo}
                onSaveValues={(values) => {
                  setStepsInputs(drawerStepInfo.id, values);
                }}
                editDisabled={!canEditTemplate}
              />
            )}

            <TriggerInfoDrawer
              onClose={() => {
                setDrawerTriggerInfo(undefined);
              }}
              open={typeof drawerTrigerInfo !== "undefined"}
              triggerInfo={drawerTrigerInfo}
              onSaveValues={(values) => {
                if (!drawerTrigerInfo) return;
                setTriggerInputs(drawerTrigerInfo.id, values);
              }}
              editDisabled={!canEditTemplate}
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

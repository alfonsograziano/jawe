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
  Position,
} from "@xyflow/react";
import { useParams } from "react-router";
import "@xyflow/react/dist/style.css";
import { Client, WorkflowTemplate } from "../client";
import AddNewPlugin from "../components/AddNewPlugin";
import { Button, message, Typography } from "antd";
import BackButton from "../components/Back";
import { useNavigate } from "react-router-dom";
import NodeWithToolbar from "../components/NodeWithToolbar";

const { Title } = Typography;

const getNodesAndEdgesFromTemplate = (data: WorkflowTemplate) => {
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
      type: "edge-with-delete",
    })) || [];

  return {
    nodes,
    edges,
  };
};

const addNewStepToTemplate = (
  template: WorkflowTemplate,
  plugin: { id: string; name: string }
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

const updateStepInTemplate = (
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

const deleteStepInTemplate = (template: WorkflowTemplate, stepId: string) => {
  const newTemplate = structuredClone(template);

  newTemplate.steps =
    newTemplate.steps && newTemplate.steps.filter((step) => step.id !== stepId);

  return newTemplate;
};

const addConnection = (template: WorkflowTemplate, connection: Connection) => {
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

const nodeTypes = {
  "node-with-toolbar": NodeWithToolbar,
};

export default function WorkflowTemplateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) return <p>You need to add an ID...</p>;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [template, setTemplate] = useState<WorkflowTemplate | undefined>();

  const loadTemplate = async (id: string) => {
    const client = new Client();
    const { data, error } = await client.loadTemplateDetails(id);
    setTemplate(data);
  };

  useEffect(() => {
    loadTemplate(id);
  }, [id]);

  useEffect(() => {
    if (!template) return;
    const { nodes: formattedNodes, edges: formattedEdges } =
      getNodesAndEdgesFromTemplate(template);

    const nodesWithActions = formattedNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onDelete: async () => {
          setTemplate(deleteStepInTemplate(template, node.id));
        },
        onOpenDetails: async () => {
          console.log("Open details of: ", node.id);
        },
      },
    }));
    setNodes(nodesWithActions as any);
    setEdges(formattedEdges as any);
  }, [template]);

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
            const newTemplate = updateStepInTemplate(template, change);
            setTemplate(newTemplate);
          }
          onNodesChange(changes);
        }}
        onEdgesChange={(changes) => {
          onEdgesChange(changes);
        }}
        onConnect={(params: Connection) => {
          setTemplate(addConnection(template, params));
        }}
        onDelete={(params) => {
          console.log(params);
        }}
        defaultEdgeOptions={{
          type: "floating",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#b1b1b7",
          },
        }}
      >
        <Panel>
          <div style={{ display: "flex", gap: 20 }}>
            <BackButton />
            <Title level={3} style={{ margin: 0 }}>
              {template.name}
            </Title>
            <AddNewPlugin
              onSelect={(plugin) => {
                const newTemplate = addNewStepToTemplate(template, plugin);
                setTemplate(newTemplate);
              }}
            />
            <Button onClick={saveTemplate} type="primary">
              Save
            </Button>

            <Button
              color="danger"
              variant="solid"
              onClick={async () => {
                await new Client().deleteTemplate(template.id);
                navigate(-1);
              }}
            >
              Delete template
            </Button>
          </div>
        </Panel>
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  Connection,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { Client, PluginsInfoList, WorkflowTemplate } from "../client";
import { Button } from "antd";
import PluginSelectorModal from "../components/PluginSelectorModal";

const initialNodes = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "1" } },
  { id: "2", position: { x: 0, y: 100 }, data: { label: "2" } },
];
const initialEdges = [{ id: "e1-2", source: "1", target: "2" }];

const loadAndFormatTemplate = async (id: string) => {
  const client = new Client();
  const { data, error } = await client.loadTemplateDetails(id);
  if (!data) throw new Error("Cannot find data");
  return formatTemplate(data);
};

const formatTemplate = (data: WorkflowTemplate) => {
  const targetNodes = [];
  if (data?.entryPoint) {
    targetNodes.push(data.entryPoint);
  }
  if (data?.steps) {
    targetNodes.push(...data.steps);
  }

  const nodes = targetNodes.map((step) => ({
    id: step.id,
    ...(step.visualizationMetadata as {}),
  }));

  const edges = data?.connections?.map((connection) => ({
    id: connection.id,
    source: connection.fromStepId,
    target: connection.toStepId,
  }));

  return {
    nodes,
    edges,
  };
};

function AddNewPlugin({
  onSelect,
}: {
  onSelect: (plugin: { id: string; name: string }) => void;
}) {
  const [availablePlugins, setAvailablePlugins] = useState<
    PluginsInfoList | undefined
  >();
  const [isPluginSelectorModalVisible, setIsPluginSelectorModalVisible] =
    useState(false);

  const handleOpenModal = () => setIsPluginSelectorModalVisible(true);
  const handleCloseModal = () => setIsPluginSelectorModalVisible(false);

  const loadPlugins = async () => {
    const client = new Client();
    const { data } = await client.loadPlugins();
    setAvailablePlugins(data);
  };

  useEffect(() => {
    loadPlugins();
  }, []);

  return (
    <div>
      {availablePlugins && (
        <>
          <Button onClick={handleOpenModal} type="primary">
            Add new step
          </Button>
          <PluginSelectorModal
            isOpen={isPluginSelectorModalVisible}
            plugins={availablePlugins}
            onSave={(selected) => {
              setIsPluginSelectorModalVisible(false);
              onSelect(
                availablePlugins.find((plugin) => plugin.id === selected) as {
                  id: string;
                  name: string;
                }
              );
            }}
            onCancel={handleCloseModal}
          />
        </>
      )}
    </div>
  );
}

export default function WorkflowTemplateDetails() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <AddNewPlugin
        onSelect={(plugin) => {
          console.log("Add new plugin...", plugin);
        }}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

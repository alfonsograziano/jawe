import { useEffect, useState } from "react";
import "@xyflow/react/dist/style.css";
import { Client, PluginsInfoList } from "../client";
import { Button } from "antd";
import PluginSelectorModal from "../components/PluginSelectorModal";

export default function AddNewPlugin({
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

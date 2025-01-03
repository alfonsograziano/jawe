import React, { useState } from "react";
import { Modal, Button, Card, Radio, RadioChangeEvent } from "antd";

type Plugin = {
  name: string;
  id: string;
  description: string;
};

type PluginModalProps = {
  isOpen: boolean;
  plugins: Plugin[];
  onSave: (selectedId: string) => void;
  onCancel: () => void;
};

const PluginSelectorModal: React.FC<PluginModalProps> = ({
  isOpen,
  plugins,
  onSave,
  onCancel,
}) => {
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);

  const handleSelect = (e: RadioChangeEvent) => {
    setSelectedPlugin(e.target.value);
  };

  const handleSave = () => {
    if (selectedPlugin) {
      onSave(selectedPlugin);
    }
  };

  return (
    <Modal
      title="Select a Plugin"
      open={isOpen}
      onCancel={onCancel}
      footer={null}
    >
      <Radio.Group
        onChange={handleSelect}
        value={selectedPlugin}
        style={{ width: "100%" }}
      >
        {plugins.map((plugin) => (
          <Card
            key={plugin.id}
            style={{ marginBottom: 16 }}
            styles={{
              body: {
                padding: 12,
              },
            }}
          >
            <Radio value={plugin.id} style={{ width: "100%" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <strong style={{ fontSize: 16 }}>{plugin.name}</strong>
                <p style={{ margin: 0, color: "#555" }}>{plugin.description}</p>
              </div>
            </Radio>
          </Card>
        ))}
      </Radio.Group>

      <div style={{ marginTop: 16, textAlign: "right" }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          Cancel
        </Button>
        <Button type="primary" onClick={handleSave} disabled={!selectedPlugin}>
          Save
        </Button>
      </div>
    </Modal>
  );
};

export default PluginSelectorModal;

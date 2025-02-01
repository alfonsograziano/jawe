import React, { useState } from "react";
import { Modal, Button, Radio, RadioChangeEvent, Row, Col } from "antd";
import Card from "antd/es/card/Card";

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
      width={800}
    >
      <Radio.Group
        onChange={handleSelect}
        value={selectedPlugin}
        style={{ width: "100%" }}
      >
        <Row gutter={[16, 16]}>
          {plugins.map((plugin) => (
            <Col span={8} key={plugin.id}>
              <Card
                hoverable
                style={{
                  height: "100%",
                }}
              >
                <Radio value={plugin.id} style={{ width: "100%" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <strong style={{ fontSize: 16 }}>{plugin.name}</strong>
                    <p style={{ margin: 0, color: "#555" }}>
                      {plugin.description}
                    </p>
                  </div>
                </Radio>
              </Card>
            </Col>
          ))}
        </Row>
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

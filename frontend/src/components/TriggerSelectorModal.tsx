import React, { useState } from "react";
import { Modal, Button, Card, Radio, RadioChangeEvent } from "antd";

type Trigger = {
  name: string;
  id: string;
  description: string;
};

type TriggerModalProps = {
  isOpen: boolean;
  triggers: Trigger[];
  onSave: (selectedId: string) => void;
  onCancel: () => void;
};

const TriggerSelectorModal: React.FC<TriggerModalProps> = ({
  isOpen,
  triggers,
  onSave,
  onCancel,
}) => {
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);

  const handleSelect = (e: RadioChangeEvent) => {
    setSelectedTrigger(e.target.value);
  };

  const handleSave = () => {
    if (selectedTrigger) {
      onSave(selectedTrigger);
    }
  };

  return (
    <Modal
      title="Select a Trigger"
      open={isOpen}
      onCancel={onCancel}
      footer={null}
    >
      <Radio.Group
        onChange={handleSelect}
        value={selectedTrigger}
        style={{ width: "100%" }}
      >
        {triggers.map((trigger) => (
          <Card
            key={trigger.id}
            style={{ marginBottom: 16 }}
            styles={{
              body: {
                padding: 12,
              },
            }}
          >
            <Radio value={trigger.id} style={{ width: "100%" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <strong style={{ fontSize: 16 }}>{trigger.name}</strong>
                <p style={{ margin: 0, color: "#555" }}>
                  {trigger.description}
                </p>
              </div>
            </Radio>
          </Card>
        ))}
      </Radio.Group>

      <div style={{ marginTop: 16, textAlign: "right" }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          Cancel
        </Button>
        <Button type="primary" onClick={handleSave} disabled={!selectedTrigger}>
          Save
        </Button>
      </div>
    </Modal>
  );
};

export default TriggerSelectorModal;

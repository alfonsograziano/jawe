import React, { useState } from "react";
import { Modal, Button, Input, message } from "antd";
import ImportButton from "./ImportButton";

type WorkflowTemplateModalProps = {
  open: boolean;
  onClose: () => void;
  onSaveCallback: (templateName: string) => Promise<void>;
  onImport: (template: Record<string, any>) => Promise<void>;
};

const WorkflowTemplateCreationModal: React.FC<WorkflowTemplateModalProps> = ({
  open,
  onClose,
  onSaveCallback,
  onImport,
}) => {
  const [templateName, setTemplateName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSave = async () => {
    if (!templateName.trim()) {
      message.warning("Template name cannot be empty!");
      return;
    }

    setLoading(true);

    try {
      await onSaveCallback(templateName);
      message.success("Workflow template created 🎉");
      onClose();
    } catch (error) {
      message.error("Failed to create workflow template. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create Workflow Template"
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="templateName">Template Name:</label>
        <Input
          id="templateName"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Enter template name"
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "40px",
        }}
      >
        or
        <ImportButton
          onImport={async (template) => {
            await onImport(template);
            onClose();
          }}
        />
      </div>

      <div style={{ textAlign: "right" }}>
        <Button onClick={onClose} style={{ marginRight: 8 }}>
          Cancel
        </Button>
        <Button type="primary" onClick={handleSave} loading={loading}>
          Save
        </Button>
      </div>
    </Modal>
  );
};

export default WorkflowTemplateCreationModal;

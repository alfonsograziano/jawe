import { Empty, Tag } from "antd";
import { WorkflowsList } from "../client";
import Card from "antd/es/card/Card";

const WorkflowTemplateCards = ({
  workflows,
  selectedWorkflowId,
  onSelectWorkflow,
}: {
  workflows: WorkflowsList;
  selectedWorkflowId?: string;
  onSelectWorkflow: (id: string) => void;
}) => {
  const getStatusTag = (status: string) => {
    const color = status === "PUBLISHED" ? "green" : "orange";
    return <Tag color={color}>{status}</Tag>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {workflows.length === 0 && (
        <Empty description="Create a template to start" />
      )}
      {workflows.map((workflow) => (
        <Card
          key={workflow.id}
          bordered
          style={{
            borderColor:
              workflow.id === selectedWorkflowId ? "blue" : "#f0f0f0",
            cursor: "pointer",
          }}
          onClick={() => onSelectWorkflow(workflow.id)}
        >
          <strong style={{ marginRight: "20px" }}>{workflow.name}</strong>
          {getStatusTag(workflow.status)}
        </Card>
      ))}
    </div>
  );
};

export default WorkflowTemplateCards;

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Typography, Spin, Button } from "antd";
import { Client, WorkflowsRunsList } from "../client";

const { Title } = Typography;

const WorkflowRunsPage = () => {
  const { id: workflowId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<WorkflowsRunsList>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRuns = async () => {
      if (!workflowId) return;
      const client = new Client();
      try {
        const { data, error } = await client.getRunsFromTemplate(workflowId);
        if (error) {
          throw new Error(error);
        }
        setData(data);
      } catch (error) {
        console.error("Error fetching workflow runs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
  }, []);

  const handleOpenDetails = (runId: string) => {
    navigate(`/workflow/${workflowId}/runs/${runId}`);
  };

  const columns = [
    {
      title: "Run ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: { id: string }) => (
        <Button type="link" onClick={() => handleOpenDetails(record.id)}>
          Open Details
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>Workflow Runs</Title>
      {loading ? (
        <Spin size="large" />
      ) : (
        <Table columns={columns} dataSource={data} rowKey="id" />
      )}
    </div>
  );
};

export default WorkflowRunsPage;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Spin, Button, Drawer } from "antd";
import { Client, WorkflowsRunsList } from "../client";
import { StatusTag, Status } from "./StatusTag";

type WorkflowRunsDrawerrProps = {
  onClose: () => void;
  open: boolean;
  workflowId: string;
};

const WorkflowRunsDrawer = ({
  onClose,
  open,
  workflowId,
}: WorkflowRunsDrawerrProps) => {
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
    if (open) fetchRuns();
  }, [open]);

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
      render: (status: Status) => <StatusTag status={status} />,
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
    <Drawer
      title={"Workflow Executions"}
      onClose={onClose}
      open={open}
      size="large"
      loading={loading}
      mask={false}
    >
      {loading ? (
        <Spin size="large" />
      ) : (
        <Table columns={columns} dataSource={data} rowKey="id" />
      )}
    </Drawer>
  );
};

export default WorkflowRunsDrawer;

import React, { useEffect, useState } from "react";
import { Button, Typography, Layout, Row, Col } from "antd";
import WorkflowTemplateCreationModal from "./components/WorkflowTemplateCreationModal";
import { Client, WorkflowsList } from "./client";
import WorkflowsTemplateList from "./components/WorkflowsTemplateList";

const { Title } = Typography;
const { Header, Content } = Layout;

const App: React.FC = () => {
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] =
    useState(false);

  const loadTemplates = async () => {
    const client = new Client();
    const res = await client.loadTemplates();
    setTemplatesList(res.data);
  };

  const [templatesList, setTemplatesList] = useState<
    WorkflowsList | undefined
  >();

  useEffect(() => {
    loadTemplates();
  }, []);

  return (
    <Layout>
      <Header style={{ background: "#fff", padding: "20px 0" }}>
        <Title level={2} style={{ margin: 0, textAlign: "center" }}>
          JAWE Workflows
        </Title>
      </Header>
      <Content style={{ padding: "20px", backgroundColor: "white" }}>
        <Row justify="end" style={{ marginBottom: "20px" }}>
          <Button
            type="primary"
            onClick={() => {
              setIsCreateTemplateModalOpen(true);
            }}
          >
            Create new Workflow
          </Button>
        </Row>
        <WorkflowTemplateCreationModal
          open={isCreateTemplateModalOpen}
          onClose={() => {
            setIsCreateTemplateModalOpen(false);
          }}
          onSaveCallback={async (templateName) => {
            const client = new Client();
            await client.createTemplate({ name: templateName });
            await loadTemplates();
          }}
        />
        {templatesList && <WorkflowsTemplateList workflows={templatesList} />}
      </Content>
    </Layout>
  );
};

export default App;

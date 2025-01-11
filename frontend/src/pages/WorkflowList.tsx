import React, { useEffect, useState } from "react";
import { Button, Empty, Splitter } from "antd";
import WorkflowTemplateCreationModal from "../components/WorkflowTemplateCreationModal";
import { Client, WorkflowsList } from "../client";
import WorkflowsTemplateList from "../components/WorkflowsTemplateList";
import { Content } from "antd/es/layout/layout";
import WorkflowTemplateDetails from "../components/WorkflowDetails";

const WorkflowList: React.FC = () => {
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] =
    useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = useState<
    string | undefined
  >();

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
    <div style={{ width: "100vw", height: "100vh", display: "flex" }}>
      <Splitter>
        <Splitter.Panel collapsible min="20%" defaultSize="20%" max="40%">
          <Content style={{ padding: "20px", backgroundColor: "white" }}>
            <Button
              style={{ width: "100%", marginBottom: "20px" }}
              type="primary"
              onClick={() => {
                setIsCreateTemplateModalOpen(true);
              }}
            >
              Create new Workflow
            </Button>
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
            {templatesList && (
              <WorkflowsTemplateList
                workflows={templatesList}
                onSelectWorkflow={setSelectedTemplateId}
                selectedWorkflowId={selectedTemplateId}
              />
            )}
          </Content>
        </Splitter.Panel>
        <Splitter.Panel>
          {selectedTemplateId ? (
            <WorkflowTemplateDetails
              id={selectedTemplateId}
              onRefetchTemplates={loadTemplates}
              onDeleteTemplate={() => {
                loadTemplates();
                setSelectedTemplateId(undefined);
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Empty description="Select a template to start" />
            </div>
          )}
        </Splitter.Panel>
      </Splitter>
    </div>
  );
};

export default WorkflowList;

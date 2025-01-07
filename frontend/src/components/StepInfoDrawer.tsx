import { Drawer } from "antd";
import { useEffect, useState } from "react";
import { Client, PluginDetails } from "../client";
import Paragraph from "antd/es/typography/Paragraph";
import Title from "antd/es/typography/Title";
import { Collapse } from "antd";
import DynamicJSONForm from "./DynamicJSONForm";

const { Panel } = Collapse;
type StepInfoDrawerProps = {
  onClose: () => void;
  open: boolean;
  stepInfo: StepInfo;
  onSaveValues: (values: any) => void;
};

type StepInfo = {
  id: string;
  type: string;
  inputs?: any;
};

const StepInfoDrawer = ({
  onClose,
  open,
  stepInfo,
  onSaveValues,
}: StepInfoDrawerProps) => {
  const [pluginData, setPluginData] = useState<PluginDetails | undefined>();
  const [loadingPluginData, setLoadingPluginData] = useState(false);

  useEffect(() => {
    setLoadingPluginData(true);

    new Client().getPluginById(stepInfo.type).then(({ data }) => {
      setPluginData(data);
      setLoadingPluginData(false);
    });
  }, [stepInfo]);

  if (!stepInfo || !pluginData) return <></>;

  return (
    <Drawer
      title={pluginData.name || "Loading"}
      onClose={onClose}
      open={open}
      size="large"
      loading={loadingPluginData}
      mask={false}
    >
      <Paragraph>{pluginData.description}</Paragraph>
      <Title level={3}>Configuration</Title>
      <DynamicJSONForm
        schema={pluginData.inputs}
        onFinish={onSaveValues}
        defaultData={stepInfo.inputs}
      />
      <Collapse>
        <Panel header="Show plugin details" key="1">
          <pre
            style={{
              overflow: "scroll",
            }}
          >
            {JSON.stringify(pluginData, null, 2)}
          </pre>
        </Panel>
      </Collapse>
    </Drawer>
  );
};

export default StepInfoDrawer;

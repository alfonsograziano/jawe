import { Drawer } from "antd";
import { useEffect, useState } from "react";
import { Client, PluginDetails } from "../client";
import Paragraph from "antd/es/typography/Paragraph";
import Title from "antd/es/typography/Title";

type StepInfoDrawerProps = {
  onClose: () => void;
  open: boolean;
  stepInfo?: StepInfo;
};

type StepInfo = {
  id: string;
  type: string;
};

const StepInfoDrawer = ({ onClose, open, stepInfo }: StepInfoDrawerProps) => {
  const [pluginData, setPluginData] = useState<PluginDetails | undefined>();
  const [loadingPluginData, setLoadingPluginData] = useState(false);

  useEffect(() => {
    if (!stepInfo) return;
    setLoadingPluginData(true);

    new Client().getPluginById(stepInfo.type).then(({ data, error }) => {
      setPluginData(data);
      setLoadingPluginData(false);
    });
  }, [stepInfo]);

  if (!stepInfo) return <></>;

  return (
    <Drawer
      title={pluginData?.name || "Loading"}
      onClose={onClose}
      open={open}
      size="large"
      loading={loadingPluginData}
    >
      <Paragraph>{pluginData?.description}</Paragraph>

      <Title level={3}>Configuration</Title>

      <pre>{JSON.stringify(pluginData, null, 2)}</pre>
    </Drawer>
  );
};

export default StepInfoDrawer;

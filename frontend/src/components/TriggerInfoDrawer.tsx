import { Drawer } from "antd";
import { useEffect, useState } from "react";
import { Client, TriggerDetails } from "../client";
import Paragraph from "antd/es/typography/Paragraph";
import Title from "antd/es/typography/Title";
import DynamicJSONForm from "./DynamicJSONForm";
import { Collapse } from "antd";

const { Panel } = Collapse;
type TriggerInfoDrawerProps = {
  onClose: () => void;
  open: boolean;
  triggerInfo?: TriggerInfo;
};

type TriggerInfo = {
  id: string;
  type: string;
};

const TriggerInfoDrawer = ({
  onClose,
  open,
  triggerInfo,
}: TriggerInfoDrawerProps) => {
  const [triggerData, setTriggerData] = useState<TriggerDetails | undefined>();
  const [loadingTriggerData, setLoadingTriggerData] = useState(false);

  useEffect(() => {
    if (!triggerInfo) return;
    setLoadingTriggerData(true);

    new Client().getTriggerById(triggerInfo.type).then(({ data }) => {
      setTriggerData(data);
      setLoadingTriggerData(false);
    });
  }, [triggerInfo]);

  if (!triggerInfo) return <></>;

  return (
    <Drawer
      title={triggerData?.name || "Loading"}
      onClose={onClose}
      open={open}
      size="large"
      mask={false}
      loading={loadingTriggerData}
    >
      <Paragraph>{triggerData?.description}</Paragraph>

      <Title level={3}>Trigger configuration</Title>

      <DynamicJSONForm
        schema={triggerData?.input}
        onFinish={(values) => {
          console.log(values);
        }}
      />

      <Collapse>
        <Panel header="Show trigger details" key="1">
          <pre
            style={{
              overflow: "scroll",
            }}
          >
            {JSON.stringify(triggerData, null, 2)}
          </pre>
        </Panel>
      </Collapse>
    </Drawer>
  );
};

export default TriggerInfoDrawer;

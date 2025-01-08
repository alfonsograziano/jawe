import { Drawer, Divider, Button } from "antd";
import { useEffect, useState } from "react";
import { Client, TriggerDetails } from "../client";
import Paragraph from "antd/es/typography/Paragraph";
import Title from "antd/es/typography/Title";
import { Collapse } from "antd";
import Form from "@rjsf/antd";
import validator from "@rjsf/validator-ajv8";

import { IconButtonProps } from "@rjsf/utils";

function SubmitButton(props: IconButtonProps) {
  const { icon, iconType, ...btnProps } = props;
  return (
    <Button type="primary" htmlType="submit" {...btnProps}>
      Submit
    </Button>
  );
}

const { Panel } = Collapse;
type TriggerInfoDrawerProps = {
  onClose: () => void;
  open: boolean;
  triggerInfo?: TriggerInfo;
  onSaveValues: (values: any) => void;
  editDisabled: boolean;
};

type TriggerInfo = {
  id: string;
  type: string;
  inputs: string;
};

const TriggerInfoDrawer = ({
  onClose,
  open,
  triggerInfo,
  onSaveValues,
  editDisabled,
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

  if (!triggerInfo || !triggerData) return <></>;

  return (
    <Drawer
      title={triggerData.name || "Loading"}
      onClose={onClose}
      open={open}
      size="large"
      mask={false}
      loading={loadingTriggerData}
    >
      <Paragraph>{triggerData.description}</Paragraph>

      <Title level={3}>Trigger configuration</Title>

      {triggerData.inputs && (
        <Form
          schema={triggerData.inputs}
          validator={validator}
          formData={triggerInfo.inputs}
          templates={{ ButtonTemplates: { SubmitButton } }}
          onSubmit={(values: any) => {
            onSaveValues(values.formData);
            onClose();
          }}
          disabled={editDisabled}
        />
      )}
      <Divider />

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

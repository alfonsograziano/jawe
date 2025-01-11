import { Drawer, Divider, Button } from "antd";
import { useEffect, useState } from "react";
import { Client, PluginDetails } from "../client";
import Paragraph from "antd/es/typography/Paragraph";
import Title from "antd/es/typography/Title";
import { Collapse } from "antd";
import Form from "@rjsf/antd";
import validator from "@rjsf/validator-ajv8";
import { IconButtonProps } from "@rjsf/utils";
import JsonInputForm from "./JSONInputForm";

function SubmitButton(props: IconButtonProps) {
  const { icon, iconType, ...btnProps } = props;
  return (
    <Button type="primary" htmlType="submit" {...btnProps}>
      Submit
    </Button>
  );
}

const { Panel } = Collapse;
type StepInfoDrawerProps = {
  onClose: () => void;
  open: boolean;
  stepInfo: StepInfo;
  onSaveValues: (values: any) => void;
  editDisabled: boolean;
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
  editDisabled,
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

      <Paragraph>Step ID: {stepInfo.id}</Paragraph>

      {pluginData.inputs && (
        <>
          {pluginData.id === "conditional-plugin" ? (
            <JsonInputForm
              stepInfo={stepInfo}
              onSaveValues={onSaveValues}
              onClose={onClose}
              editDisabled={editDisabled}
            />
          ) : (
            <Form
              schema={pluginData.inputs}
              validator={validator}
              formData={stepInfo.inputs}
              templates={{ ButtonTemplates: { SubmitButton } }}
              onSubmit={(values: any) => {
                onSaveValues(values.formData);
                onClose();
              }}
              disabled={editDisabled}
            />
          )}
        </>
      )}
      <Divider />
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

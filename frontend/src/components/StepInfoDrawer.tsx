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
import Editor from "@monaco-editor/react";

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
  const [fullScreen, setFullScreen] = useState(false);

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
      title={
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {pluginData.name || "Loading"}

            <Button
              onClick={() => setFullScreen(!fullScreen)}
              style={{ marginBottom: "0px" }}
            >
              {fullScreen ? "Exit Full Screen" : "Full Screen"}
            </Button>
          </div>
        </>
      }
      onClose={onClose}
      open={open}
      size="large"
      loading={loadingPluginData}
      mask={false}
      width={fullScreen ? "100vw" : undefined} // Adjust width dynamically
      height={fullScreen ? "100vh" : undefined} // Optional for vertical drawers
    >
      <Paragraph>{pluginData.description}</Paragraph>
      <Title level={3}>Configuration</Title>
      <Paragraph>Step ID: {stepInfo.id}</Paragraph>
      {pluginData.inputs && pluginData.id === "execute-js" ? (
        <ExecuteJSPlugin
          stepInfo={stepInfo}
          onSave={(values: any) => {
            onSaveValues(values);
            onClose();
          }}
          pluginData={pluginData}
        />
      ) : pluginData.inputs && pluginData.id === "conditional-plugin" ? (
        <ConditionalPlugin
          stepInfo={stepInfo}
          onSave={(values: any) => {
            onSaveValues(values);
            onClose();
          }}
          pluginData={pluginData}
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

type ExecuteJSPluginProps = {
  stepInfo: StepInfo;
  pluginData: PluginDetails;
  onSave: (values: any) => void;
};
const ExecuteJSPlugin = ({
  stepInfo,
  pluginData,
  onSave,
}: ExecuteJSPluginProps) => {
  const [inputs, setInputs] = useState(stepInfo.inputs);

  function removeCodeProperty(schema: Record<string, any>) {
    if (schema) {
      if (Array.isArray(schema.required)) {
        schema.required = schema.required.filter((field) => field !== "code");
      }
      if (schema.properties && schema.properties.code) {
        delete schema.properties.code;
      }
    }
    return schema;
  }

  return (
    <div>
      <Editor
        height="200px"
        defaultLanguage="javascript"
        value={inputs?.code || ""}
        onChange={(value: string) => {
          setInputs({ ...inputs, code: value });
        }}
        options={{ minimap: { enabled: false } }}
      />
      <Form
        schema={removeCodeProperty(pluginData.inputs)}
        validator={validator}
        formData={inputs}
        templates={{ ButtonTemplates: { SubmitButton } }}
        onSubmit={(values: any) => {
          onSave({ ...values.formData, code: inputs.code });
        }}
      />
    </div>
  );
};

type ConditionalPluginProps = {
  stepInfo: StepInfo;
  pluginData: PluginDetails;
  onSave: (values: any) => void;
};
const ConditionalPlugin = ({
  stepInfo,
  pluginData,
  onSave,
}: ConditionalPluginProps) => {
  const [inputs, setInputs] = useState(stepInfo.inputs);

  function removeRulesProperty(schema: Record<string, any>) {
    if (schema) {
      if (Array.isArray(schema.required)) {
        schema.required = schema.required.filter((field) => field !== "rules");
      }
      if (schema.properties && schema.properties.rules) {
        delete schema.properties.rules;
      }
    }
    return schema;
  }

  return (
    <div>
      <h2>Rules:</h2>
      <Editor
        height="200px"
        defaultLanguage="json"
        value={inputs?.rules || ""}
        onChange={(value: string) => {
          setInputs({ ...inputs, rules: value });
        }}
        options={{ minimap: { enabled: false } }}
      />
      <h2>Facts (variables): </h2>
      <Form
        schema={removeRulesProperty(pluginData.inputs)}
        validator={validator}
        formData={inputs}
        templates={{ ButtonTemplates: { SubmitButton } }}
        onSubmit={(values: any) => {
          const rules = JSON.parse(inputs.rules);
          onSave({ ...values.formData, rules });
        }}
      />
    </div>
  );
};

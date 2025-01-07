import { Form, Input, Button, Select, Checkbox, InputNumber } from "antd";

type DynamicJSONFormProps = {
  schema: any;
  onFinish: (values: any) => void;
};

const DynamicJSONForm = ({ schema, onFinish }: DynamicJSONFormProps) => {
  const [form] = Form.useForm();

  if (!schema) return;

  const renderField = (key: string, config: any) => {
    const { description, type, anyOf, pattern, format } = config;

    const label = description ? `${description} (${key})` : key;

    if (anyOf) {
      return (
        <Form.Item
          name={key}
          label={label}
          rules={[{ required: schema.required.includes(key) }]}
        >
          <Select placeholder={`Select a value for ${key}`}>
            {anyOf.map((option: { const: string }) => (
              <Select.Option key={option.const} value={option.const}>
                {option.const}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      );
    }

    switch (type) {
      case "string":
        return (
          <Form.Item
            name={key}
            label={label}
            rules={[
              {
                required: schema.required.includes(key),
              },
              pattern && {
                pattern: new RegExp(pattern),
                message: `Invalid format for ${key}`,
              },
              format === "uri" && {
                type: "url",
                message: `Invalid URI format`,
              },
            ].filter(Boolean)}
          >
            <Input placeholder={`Enter value for ${key}`} />
          </Form.Item>
        );

      case "boolean":
        return (
          <Form.Item
            name={key}
            label={label}
            valuePropName="checked"
            rules={[{ required: schema.required.includes(key) }]}
          >
            <Checkbox>{key}</Checkbox>
          </Form.Item>
        );

      case "number":
        return (
          <Form.Item
            name={key}
            label={label}
            rules={[{ required: schema.required.includes(key) }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder={`Enter number for ${key}`}
            />
          </Form.Item>
        );

      default:
        return null;
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      {Object.entries(schema.properties).map(([key, config]) =>
        renderField(key, config)
      )}
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default DynamicJSONForm;

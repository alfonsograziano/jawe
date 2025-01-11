import { Form, Input, Button } from "antd";

interface Props {
  stepInfo: {
    inputs?: object;
  };
  onSaveValues: (values: any) => void;
  onClose: () => void;
  editDisabled: boolean;
}

const JsonInputForm: React.FC<Props> = ({
  stepInfo,
  onSaveValues,
  onClose,
  editDisabled,
}) => {
  const handleSubmit = (values: any) => {
    try {
      console.log(values.formData);
      const parsedJson = JSON.parse(values.formData);
      onSaveValues(parsedJson);
      onClose();
    } catch (error) {
      console.error("Invalid JSON", error);
    }
  };

  return (
    <Form
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        formData: JSON.stringify(stepInfo.inputs, null, 2),
      }}
    >
      <Form.Item
        name="formData"
        label="JSON Input"
        rules={[
          { required: true, message: "Please provide a valid JSON" },
          () => ({
            validator(_, value) {
              try {
                console.log(value);
                JSON.parse(value);
                return Promise.resolve();
              } catch {
                return Promise.reject(new Error("Invalid JSON format"));
              }
            },
          }),
        ]}
      >
        <Input.TextArea
          rows={8}
          disabled={editDisabled}
          placeholder="Enter your JSON here"
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" disabled={editDisabled}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default JsonInputForm;

import { Button, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd/es/upload";

const ImportButton = ({
  onImport,
}: {
  onImport: (template: Record<string, any>) => Promise<void>;
}) => {
  const handleFileUpload: UploadProps["beforeUpload"] = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (event.target) {
          const jsonData = JSON.parse(event.target.result as string);

          onImport(jsonData);

          message.success("File successfully imported!");
        }
      } catch (error) {
        console.log(error);
        message.error("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    return false; // Prevent automatic upload behavior
  };

  return (
    <Upload
      beforeUpload={handleFileUpload}
      showUploadList={false}
      accept=".json"
    >
      <Button type="primary" icon={<UploadOutlined />}>
        Import JSON
      </Button>
    </Upload>
  );
};

export default ImportButton;

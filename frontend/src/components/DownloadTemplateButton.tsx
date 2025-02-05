import { Button, Popover } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

const DownloadTemplateButton = ({
  templateDefinition,
}: {
  templateDefinition: Record<string, any>;
}) => {
  const handleDownload = () => {
    const jsonString = JSON.stringify(templateDefinition, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${templateDefinition.title}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Popover content="Download the Template definition" trigger="hover">
      <Button icon={<DownloadOutlined />} onClick={handleDownload} />
    </Popover>
  );
};

export default DownloadTemplateButton;

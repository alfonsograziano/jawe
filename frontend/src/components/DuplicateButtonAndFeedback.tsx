import { Button, Tooltip, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const DuplicateButtonAndFeedback = ({
  duplicateTemplate,
}: {
  duplicateTemplate: () => Promise<{ id: string | undefined }>;
}) => {
  const navigate = useNavigate();

  const handleDuplicate = async () => {
    const { id } = await duplicateTemplate();
    if (!id) {
      message.error("Error in duplicating the template...");
      return;
    }
    message.info({
      content: (
        <>
          New template created.
          <Button type="link" onClick={() => navigate(`/workflow/${id}`)}>
            Open
          </Button>
        </>
      ),
      duration: 3,
    });
  };

  return (
    <Tooltip title="Duplicate template">
      <Button
        type="default"
        icon={<CopyOutlined />}
        onClick={handleDuplicate}
      />
    </Tooltip>
  );
};

export default DuplicateButtonAndFeedback;

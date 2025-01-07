import React from "react";
import { Button, Popconfirm, Popover } from "antd";
import { StarFilled } from "@ant-design/icons";

type PublishTemplateProps = {
  onConfirmPublish: () => Promise<void>;
};

const PublishTemplate: React.FC<PublishTemplateProps> = ({
  onConfirmPublish,
}) => {
  return (
    <Popover content="Publish template">
      <Popconfirm
        title={
          <>
            <div>Are you sure you want to publish this template?</div>
            <div>
              After publishing, you will not be able to edit the template
              anymore.
            </div>
          </>
        }
        onConfirm={async () => {
          await onConfirmPublish();
        }}
        okText="Publish"
        cancelText="Cancel"
      >
        <Button
          style={{
            backgroundImage: "linear-gradient(120deg, blue, violet)",
            color: "white",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onClick={() => {}}
          size="large"
          icon={<StarFilled style={{ color: "yellow" }} />}
        >
          Publish
        </Button>
      </Popconfirm>
    </Popover>
  );
};

export default PublishTemplate;

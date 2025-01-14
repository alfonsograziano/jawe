import React from "react";
import { Button, Popconfirm, Popover } from "antd";
import { StarFilled } from "@ant-design/icons";

type PublishTemplateProps = {
  onConfirmPublish: () => Promise<void>;
  disabled: boolean;
};

const PublishTemplate: React.FC<PublishTemplateProps> = ({
  onConfirmPublish,
  disabled,
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
          type="primary"
          onClick={() => {}}
          size="large"
          icon={<StarFilled />}
          disabled={disabled}
        >
          Publish
        </Button>
      </Popconfirm>
    </Popover>
  );
};

export default PublishTemplate;

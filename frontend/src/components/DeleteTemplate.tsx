import React from "react";
import { Button, Popconfirm, Popover } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

type DeleteTemplateProps = {
  onConfirmDelete: () => Promise<void>;
};

const DeleteTemplate: React.FC<DeleteTemplateProps> = ({ onConfirmDelete }) => {
  return (
    <Popover content="Delete template">
      <Popconfirm
        title="Are you sure you want to delete this template?"
        onConfirm={async () => {
          await onConfirmDelete();
        }}
        okText="Yes"
        cancelText="No"
      >
        <Button danger type="primary" icon={<DeleteOutlined />} />
      </Popconfirm>
    </Popover>
  );
};

export default DeleteTemplate;

import React from "react";
import { Button } from "antd";
import { LeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const BackButton: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Button
      type="default"
      icon={<LeftOutlined />}
      onClick={handleBack}
      style={{ display: "flex", alignItems: "center" }}
    >
      Back
    </Button>
  );
};

export default BackButton;

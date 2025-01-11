import { Tag } from "antd";

export const nodeStyleBasedOnStatus = {
  PENDING: {
    borderColor: "gray",
    borderWidth: "1px",
    color: "default",
  },
  RUNNING: {
    borderColor: "orange",
    borderWidth: "1.5px",
    color: "orange",
  },
  COMPLETED: {
    borderColor: "green",
    borderWidth: "1.5px",
    color: "green",
  },
  FAILED: {
    borderColor: "red",
    borderWidth: "2px",
    color: "red",
  },
};

export type Status = keyof typeof nodeStyleBasedOnStatus;

export const StatusTag = ({
  status,
  label,
}: {
  status: Status;
  label?: string;
}) => {
  return (
    <Tag color={nodeStyleBasedOnStatus[status].color}>
      {label ? label : status}
    </Tag>
  );
};

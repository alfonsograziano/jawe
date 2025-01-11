import { Drawer } from "antd";
import { StatusTag } from "./StatusTag";

type StepRunInfoDrawerProps = {
  onClose: () => void;
  open: boolean;
  stepInfo: StepInfo;
};

type StepInfo = {
  id: string;
  output: any;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const StepRunInfoDrawer = ({
  onClose,
  open,
  stepInfo,
}: StepRunInfoDrawerProps) => {
  return (
    <Drawer
      title={"Run Details"}
      onClose={onClose}
      open={open}
      size="large"
      mask={false}
    >
      <div>
        <h3>Step Information</h3>
        <p>
          <strong>ID:</strong> {stepInfo.id}
        </p>
        <p>
          <strong>Status:</strong> <StatusTag status={stepInfo.status} />
        </p>
        <p>
          <strong>Created At:</strong>{" "}
          {new Date(stepInfo.createdAt).toLocaleString()}
        </p>
        <p>
          <strong>Updated At:</strong>{" "}
          {new Date(stepInfo.updatedAt).toLocaleString()}
        </p>
        <h3>Output</h3>
        <pre
          style={{
            background: "#f5f5f5",
            padding: "16px",
            borderRadius: "8px",
            overflow: "auto",
            maxHeight: "400px",
          }}
        >
          {JSON.stringify(stepInfo.output, null, 2)}
        </pre>
      </div>
    </Drawer>
  );
};

export default StepRunInfoDrawer;

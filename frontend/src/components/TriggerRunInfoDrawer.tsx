import { Drawer } from "antd";

type TriggerRunInfoDrawerProps = {
  onClose: () => void;
  open: boolean;
  triggerRunInfo: {
    id: string;
    output: any;
  };
};

const TriggerRunInfoDrawer = ({
  onClose,
  open,
  triggerRunInfo,
}: TriggerRunInfoDrawerProps) => {
  return (
    <Drawer
      title={"Trigger Run Details"}
      onClose={onClose}
      open={open}
      size="large"
      mask={false}
    >
      <div>
        <h3>Step Information</h3>
        <p>
          <strong>ID:</strong> {triggerRunInfo.id}
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
          {JSON.stringify(triggerRunInfo.output, null, 2)}
        </pre>
      </div>
    </Drawer>
  );
};

export default TriggerRunInfoDrawer;

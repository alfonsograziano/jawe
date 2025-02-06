import { Position, NodeToolbar, Handle } from "@xyflow/react";
import { Button, Switch, Popover } from "antd";
import {
  DeleteOutlined,
  InfoCircleOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";

export default function TriggerWithToolbar({
  data,
}: {
  data: {
    forceToolbarVisible: boolean;
    toolbarPosition: Position;
    label: string;
    isEnabled: boolean;
    onDelete?: () => void;
    onOpenDetails: () => void;
    onEnableChange: (enabled: boolean) => void;
  };
}) {
  return (
    <>
      <NodeToolbar
        isVisible={data.forceToolbarVisible || undefined}
        position={data.toolbarPosition}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <Button icon={<InfoCircleOutlined />} onClick={data.onOpenDetails} />
          {data.onDelete && (
            <Button icon={<DeleteOutlined />} onClick={data.onDelete} />
          )}
        </div>
      </NodeToolbar>

      <div>
        <ThunderboltFilled style={{ fontSize: "16px", color: "#08c" }} />
        <div>{data.label}</div>
        <Popover
          content={
            <p>
              The trigger can either be enabled or disabled.
              <br /> If disabled, the trigger will not run when invoked.
            </p>
          }
        >
          <Switch
            value={data.isEnabled}
            onChange={data.onEnableChange}
            size="small"
          />
        </Popover>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={true} />
    </>
  );
}

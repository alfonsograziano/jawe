import { Position, NodeToolbar, Handle } from "@xyflow/react";
import { Button } from "antd";
import {
  DeleteOutlined,
  InfoCircleOutlined,
  NodeIndexOutlined,
} from "@ant-design/icons";

export default function EntryPointWithToolbar({
  data,
}: {
  data: {
    forceToolbarVisible: boolean;
    toolbarPosition: Position;
    label: string;
    onDelete: () => void;
    onOpenDetails: () => void;
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
          <Button icon={<DeleteOutlined />} onClick={data.onDelete} />
        </div>
      </NodeToolbar>

      <Handle type="target" position={Position.Top} isConnectable={true} />
      <Handle type="source" position={Position.Bottom} isConnectable={true} />
      <div>
        <NodeIndexOutlined style={{ fontSize: "16px", color: "#08c" }} />
        <div>{data.label}</div>
      </div>
    </>
  );
}

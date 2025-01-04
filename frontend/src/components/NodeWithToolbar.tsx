import { Position, NodeToolbar, Handle } from "@xyflow/react";
import { Button } from "antd";
import { DeleteOutlined, InfoCircleOutlined } from "@ant-design/icons";

export default function NodeWithToolbar({
  data,
}: {
  data: {
    isEntryPoint: boolean;
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

      {data.isEntryPoint ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            isConnectable={true}
          />
        </>
      ) : (
        <>
          <Handle type="target" position={Position.Top} isConnectable={true} />

          <Handle
            type="source"
            position={Position.Bottom}
            isConnectable={true}
          />
        </>
      )}

      <div>{data.label}</div>
    </>
  );
}

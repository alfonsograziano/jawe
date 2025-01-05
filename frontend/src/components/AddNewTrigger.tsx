import { useEffect, useState } from "react";
import "@xyflow/react/dist/style.css";
import { Client, TriggersInfoList } from "../client";
import { Button } from "antd";
import TriggerSelectorModal from "./TriggerSelectorModal";

export default function AddNewTrigger({
  onSelect,
}: {
  onSelect: (trigger: { id: string; name: string }) => void;
}) {
  const [availableTriggers, setAvailableTriggers] = useState<
    TriggersInfoList | undefined
  >();
  const [isTriggerSelectorModalVisible, setIsTriggerSelectorModalVisible] =
    useState(false);

  const handleOpenModal = () => setIsTriggerSelectorModalVisible(true);
  const handleCloseModal = () => setIsTriggerSelectorModalVisible(false);

  const loadTriggers = async () => {
    const client = new Client();
    const { data } = await client.loadTriggers();
    setAvailableTriggers(data);
  };

  useEffect(() => {
    loadTriggers();
  }, []);

  return (
    <div>
      {availableTriggers && (
        <>
          <Button onClick={handleOpenModal} type="primary">
            Add new trigger
          </Button>
          <TriggerSelectorModal
            isOpen={isTriggerSelectorModalVisible}
            triggers={availableTriggers}
            onSave={(selected) => {
              setIsTriggerSelectorModalVisible(false);
              onSelect(
                availableTriggers.find(
                  (trigger) => trigger.id === selected
                ) as {
                  id: string;
                  name: string;
                }
              );
            }}
            onCancel={handleCloseModal}
          />
        </>
      )}
    </div>
  );
}

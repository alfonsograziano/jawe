import { Drawer } from "antd";

type StepInfoDrawerProps = {
  onClose: () => void;
  open: boolean;
  stepInfo: StepInfo;
};

type StepInfo = {
  id: string;
  name: string;
  description: string;
};

const StepInfoDrawer = ({ onClose, open, stepInfo }: StepInfoDrawerProps) => {
  return (
    <Drawer title={stepInfo.name} onClose={onClose} open={open} size="large">
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
    </Drawer>
  );
};

export default StepInfoDrawer;

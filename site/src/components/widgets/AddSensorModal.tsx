import AddSensorDialog from '@/components/sensors/AddSensorDialog';

interface AddSensorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSensorModal({ open, onOpenChange }: AddSensorModalProps) {
  return <AddSensorDialog open={open} onOpenChange={onOpenChange} />;
}

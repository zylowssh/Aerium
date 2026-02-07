import { Radio, Cpu } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface SensorTypeSelectorProps {
  value: 'real' | 'simulation';
  onChange: (value: 'real' | 'simulation') => void;
}

const SensorTypeSelector = ({ value, onChange }: SensorTypeSelectorProps) => {
  return (
    <div className="space-y-3">
      <Label>Type de capteur</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as 'real' | 'simulation')}
        className="grid grid-cols-2 gap-4"
      >
        <div className="relative">
          <RadioGroupItem
            value="simulation"
            id="simulation"
            className="peer sr-only"
          />
          <Label
            htmlFor="simulation"
            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-colors"
          >
            <Cpu className="w-8 h-8 mb-2 text-muted-foreground peer-data-[state=checked]:text-primary" />
            <span className="font-medium text-foreground">Simulation</span>
            <span className="text-xs text-muted-foreground text-center mt-1">
              Données générées automatiquement
            </span>
          </Label>
        </div>

        <div className="relative">
          <RadioGroupItem
            value="real"
            id="real"
            className="peer sr-only"
          />
          <Label
            htmlFor="real"
            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-colors"
          >
            <Radio className="w-8 h-8 mb-2 text-muted-foreground peer-data-[state=checked]:text-primary" />
            <span className="font-medium text-foreground">Capteur Réel</span>
            <span className="text-xs text-muted-foreground text-center mt-1">
              SDC30 via WebSocket
            </span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default SensorTypeSelector;

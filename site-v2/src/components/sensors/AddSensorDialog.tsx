import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSensors } from '@/hooks/useSensors';
import SensorTypeSelector from './SensorTypeSelector';

interface AddSensorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddSensorDialog = ({ open, onOpenChange }: AddSensorDialogProps) => {
  const { createSensor } = useSensors();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [sensorType, setSensorType] = useState<'real' | 'simulation'>('simulation');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !location.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      await createSensor(name, location, sensorType);
      toast.success('Capteur créé avec succès');
      onOpenChange(false);
      setName('');
      setLocation('');
      setSensorType('simulation');
    } catch (error) {
      toast.error('Erreur lors de la création du capteur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un Capteur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du capteur</Label>
            <Input
              id="name"
              placeholder="Ex: Bureau Principal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Emplacement</Label>
            <Input
              id="location"
              placeholder="Ex: Bâtiment A, 2ᵉ étage"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <SensorTypeSelector value={sensorType} onChange={setSensorType} />
          
          {sensorType === 'real' && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                <strong>Configuration SDC30 :</strong> Une fois le capteur créé, 
                connectez votre SDC30 via WebSocket à l'endpoint fourni pour envoyer 
                les données en temps réel.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer le Capteur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSensorDialog;

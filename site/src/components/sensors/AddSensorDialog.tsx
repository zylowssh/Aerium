import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useSensors } from '@/hooks/useSensors';
import SensorTypeSelector from './SensorTypeSelector';
import {
  DEFAULT_REAL_CONNECTION_METHOD,
  DEFAULT_REAL_SENSOR_MODEL,
  REAL_CONNECTION_METHOD_OPTIONS,
  REAL_SENSOR_MODEL_OPTIONS,
  RealConnectionMethod,
  getConnectionMethodDescription,
  getConnectionMethodLabel,
} from '@/lib/realSensorConfig';

interface AddSensorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddSensorDialog = ({ open, onOpenChange }: AddSensorDialogProps) => {
  const { createSensor } = useSensors();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [sensorType, setSensorType] = useState<'real' | 'simulation'>('simulation');
  const [sensorModel, setSensorModel] = useState(DEFAULT_REAL_SENSOR_MODEL);
  const [customSensorModel, setCustomSensorModel] = useState('');
  const [connectionMethod, setConnectionMethod] = useState<RealConnectionMethod>(DEFAULT_REAL_CONNECTION_METHOD);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedLocation = location.trim();
    const resolvedModel = sensorModel === 'custom' ? customSensorModel.trim() : sensorModel;
    
    if (!trimmedName || !trimmedLocation) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (sensorType === 'real' && !resolvedModel) {
      toast.error('Veuillez sélectionner ou saisir un modèle de capteur réel');
      return;
    }

    setIsLoading(true);
    try {
      await createSensor(
        trimmedName,
        trimmedLocation,
        sensorType,
        sensorType === 'real'
          ? {
              sensorModel: resolvedModel,
              connectionMethod,
            }
          : undefined
      );
      toast.success(
        sensorType === 'real'
          ? 'Capteur réel ajouté (en attente de connexion)'
          : 'Capteur de simulation créé avec succès'
      );
      onOpenChange(false);
      setName('');
      setLocation('');
      setSensorType('simulation');
      setSensorModel(DEFAULT_REAL_SENSOR_MODEL);
      setCustomSensorModel('');
      setConnectionMethod(DEFAULT_REAL_CONNECTION_METHOD);
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la création du capteur');
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
            <>
              <div className="space-y-2">
                <Label htmlFor="sensor-model">Modèle du capteur réel</Label>
                <Select value={sensorModel} onValueChange={setSensorModel}>
                  <SelectTrigger id="sensor-model">
                    <SelectValue placeholder="Sélectionner un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    {REAL_SENSOR_MODEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {REAL_SENSOR_MODEL_OPTIONS.find((option) => option.value === sensorModel)?.description}
                </p>
              </div>

              {sensorModel === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="custom-model">Nom du modèle</Label>
                  <Input
                    id="custom-model"
                    placeholder="Ex: Senseair S8"
                    value={customSensorModel}
                    onChange={(e) => setCustomSensorModel(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="connection-method">Méthode de connexion</Label>
                <Select
                  value={connectionMethod}
                  onValueChange={(value) => setConnectionMethod(value as RealConnectionMethod)}
                >
                  <SelectTrigger id="connection-method">
                    <SelectValue placeholder="Sélectionner une méthode" />
                  </SelectTrigger>
                  <SelectContent>
                    {REAL_CONNECTION_METHOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {REAL_CONNECTION_METHOD_OPTIONS.find((option) => option.value === connectionMethod)?.description}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-1">
                <p className="text-sm text-muted-foreground">
                  <strong>{getConnectionMethodLabel(connectionMethod)} :</strong> {getConnectionMethodDescription(connectionMethod)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Après création, la page détail du capteur affichera l'endpoint exact et les étapes de connexion.
                </p>
              </div>
            </>
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

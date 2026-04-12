import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Pencil, Radio, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditSensorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sensor?: {
    id: string;
    name: string;
    location: string;
    type: string;
    status: string;
  };
}

export function EditSensorModal({ open, onOpenChange, sensor }: EditSensorModalProps) {
  const [name, setName] = useState(sensor?.name || 'Capteur Bureau A');
  const [location, setLocation] = useState(sensor?.location || 'Salle de Réunion');
  const [type, setType] = useState(sensor?.type || 'indoor');
  const [isActive, setIsActive] = useState(true);

  const handleSave = () => {
    toast.success('Capteur mis à jour', {
      description: `${name} a été modifié avec succès.`,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    toast.success('Capteur supprimé', {
      description: `${name} a été retiré du système.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Modifier le Capteur
          </DialogTitle>
          <DialogDescription>
            Modifiez les paramètres de ce capteur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-sensor-name">Nom du capteur</Label>
            <Input
              id="edit-sensor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-sensor-location">Emplacement</Label>
            <Input
              id="edit-sensor-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-sensor-type">Type de capteur</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indoor">Intérieur</SelectItem>
                <SelectItem value="outdoor">Extérieur</SelectItem>
                <SelectItem value="industrial">Industriel</SelectItem>
                <SelectItem value="portable">Portable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Capteur actif</p>
              <p className="text-sm text-muted-foreground">Activer ou désactiver ce capteur</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button type="button" variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Supprimer
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Radio className="w-4 h-4" />
              Enregistrer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

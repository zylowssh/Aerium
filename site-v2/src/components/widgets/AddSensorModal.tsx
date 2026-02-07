import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Radio } from 'lucide-react';
import { toast } from 'sonner';

interface AddSensorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSensorModal({ open, onOpenChange }: AddSensorModalProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !type) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    toast.success('Capteur ajouté avec succès', {
      description: `${name} a été configuré pour ${location}.`,
    });
    setName('');
    setLocation('');
    setType('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5" />
            Ajouter un Capteur
          </DialogTitle>
          <DialogDescription>
            Configurez un nouveau capteur pour votre réseau de surveillance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sensor-name">Nom du capteur</Label>
            <Input
              id="sensor-name"
              placeholder="Ex: Capteur Bureau Principal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sensor-location">Emplacement</Label>
            <Input
              id="sensor-location"
              placeholder="Ex: Salle de réunion A"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sensor-type">Type de capteur</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indoor">Intérieur</SelectItem>
                <SelectItem value="outdoor">Extérieur</SelectItem>
                <SelectItem value="industrial">Industriel</SelectItem>
                <SelectItem value="portable">Portable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Thermometer, Droplets, Activity, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface AlertThresholdsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ThresholdConfig {
  enabled: boolean;
  warning: number;
  critical: number;
}

export function AlertThresholdsModal({ open, onOpenChange }: AlertThresholdsModalProps) {
  const [co2Thresholds, setCo2Thresholds] = useState<ThresholdConfig>({
    enabled: true,
    warning: 800,
    critical: 1200
  });

  const [tempThresholds, setTempThresholds] = useState<ThresholdConfig>({
    enabled: true,
    warning: 26,
    critical: 30
  });

  const [humidityThresholds, setHumidityThresholds] = useState<ThresholdConfig>({
    enabled: true,
    warning: 70,
    critical: 80
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false
  });

  const handleSave = () => {
    toast.success('Seuils enregistrés', {
      description: 'Vos seuils d\'alerte ont été mis à jour avec succès.'
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setCo2Thresholds({ enabled: true, warning: 800, critical: 1200 });
    setTempThresholds({ enabled: true, warning: 26, critical: 30 });
    setHumidityThresholds({ enabled: true, warning: 70, critical: 80 });
    toast.info('Seuils réinitialisés', {
      description: 'Les valeurs par défaut ont été restaurées.'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Configuration des Seuils d'Alerte
          </DialogTitle>
          <DialogDescription>
            Personnalisez les seuils de déclenchement des alertes pour chaque métrique.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="co2" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="co2" className="gap-2">
              <Activity className="w-4 h-4" />
              CO₂
            </TabsTrigger>
            <TabsTrigger value="temperature" className="gap-2">
              <Thermometer className="w-4 h-4" />
              Temp.
            </TabsTrigger>
            <TabsTrigger value="humidity" className="gap-2">
              <Droplets className="w-4 h-4" />
              Humidité
            </TabsTrigger>
          </TabsList>

          <TabsContent value="co2" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="co2-enabled">Alertes CO₂ activées</Label>
              <Switch
                id="co2-enabled"
                checked={co2Thresholds.enabled}
                onCheckedChange={(checked) => setCo2Thresholds({ ...co2Thresholds, enabled: checked })}
              />
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-warning">Seuil d'avertissement</Label>
                  <span className="text-sm font-medium">{co2Thresholds.warning} ppm</span>
                </div>
                <Slider
                  value={[co2Thresholds.warning]}
                  onValueChange={([v]) => setCo2Thresholds({ ...co2Thresholds, warning: v })}
                  min={400}
                  max={1500}
                  step={50}
                  disabled={!co2Thresholds.enabled}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-destructive">Seuil critique</Label>
                  <span className="text-sm font-medium">{co2Thresholds.critical} ppm</span>
                </div>
                <Slider
                  value={[co2Thresholds.critical]}
                  onValueChange={([v]) => setCo2Thresholds({ ...co2Thresholds, critical: v })}
                  min={600}
                  max={2000}
                  step={50}
                  disabled={!co2Thresholds.enabled}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="temperature" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="temp-enabled">Alertes température activées</Label>
              <Switch
                id="temp-enabled"
                checked={tempThresholds.enabled}
                onCheckedChange={(checked) => setTempThresholds({ ...tempThresholds, enabled: checked })}
              />
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-warning">Seuil d'avertissement</Label>
                  <span className="text-sm font-medium">{tempThresholds.warning}°C</span>
                </div>
                <Slider
                  value={[tempThresholds.warning]}
                  onValueChange={([v]) => setTempThresholds({ ...tempThresholds, warning: v })}
                  min={20}
                  max={35}
                  step={1}
                  disabled={!tempThresholds.enabled}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-destructive">Seuil critique</Label>
                  <span className="text-sm font-medium">{tempThresholds.critical}°C</span>
                </div>
                <Slider
                  value={[tempThresholds.critical]}
                  onValueChange={([v]) => setTempThresholds({ ...tempThresholds, critical: v })}
                  min={25}
                  max={40}
                  step={1}
                  disabled={!tempThresholds.enabled}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="humidity" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="humidity-enabled">Alertes humidité activées</Label>
              <Switch
                id="humidity-enabled"
                checked={humidityThresholds.enabled}
                onCheckedChange={(checked) => setHumidityThresholds({ ...humidityThresholds, enabled: checked })}
              />
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-warning">Seuil d'avertissement</Label>
                  <span className="text-sm font-medium">{humidityThresholds.warning}%</span>
                </div>
                <Slider
                  value={[humidityThresholds.warning]}
                  onValueChange={([v]) => setHumidityThresholds({ ...humidityThresholds, warning: v })}
                  min={30}
                  max={90}
                  step={5}
                  disabled={!humidityThresholds.enabled}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-destructive">Seuil critique</Label>
                  <span className="text-sm font-medium">{humidityThresholds.critical}%</span>
                </div>
                <Slider
                  value={[humidityThresholds.critical]}
                  onValueChange={([v]) => setHumidityThresholds({ ...humidityThresholds, critical: v })}
                  min={40}
                  max={100}
                  step={5}
                  disabled={!humidityThresholds.enabled}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Notification Settings */}
        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-3">Canaux de Notification</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-email">Email</Label>
              <Switch
                id="notif-email"
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-push">Notifications push</Label>
              <Switch
                id="notif-push"
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-sms">SMS</Label>
              <Switch
                id="notif-sms"
                checked={notifications.sms}
                onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

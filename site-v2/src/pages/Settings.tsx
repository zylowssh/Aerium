import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
 import { Building, Bell, Users, Plug, Palette, Moon, Sun, Server, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/hooks/useTheme';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';
 import { BackendStatusWidget } from '@/components/widgets/BackendStatusWidget';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useSensors } from '@/hooks/useSensors';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { compactMode, setCompactMode, animationsEnabled, setAnimationsEnabled } = useSettings();
  const { sensors } = useSensors();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sensorThresholds, setSensorThresholds] = useState<Record<string, any>>({});
  const [savingThresholds, setSavingThresholds] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    // Initialize sensor thresholds from loaded sensors
    const thresholds: Record<string, any> = {};
    sensors.forEach(sensor => {
      thresholds[sensor.id] = {
        co2: sensor.thresholds?.co2 ?? null,
        temp_min: sensor.thresholds?.temp_min ?? null,
        temp_max: sensor.thresholds?.temp_max ?? null,
        humidity: sensor.thresholds?.humidity ?? null
      };
    });
    setSensorThresholds(thresholds);
  }, [sensors]);

  const fetchTeamMembers = async () => {
    try {
      setLoadingUsers(true);
      const teamUsers = await apiClient.getAllUsers();
      setUsers(teamUsers);
    } catch (error) {
      console.error('Error fetching team members:', error);
      // Set empty array if fetch fails
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleThresholdChange = (sensorId: string, field: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setSensorThresholds(prev => ({
      ...prev,
      [sensorId]: {
        ...prev[sensorId],
        [field]: numValue
      }
    }));
  };

  const handleSaveThresholds = async (sensorId: string) => {
    try {
      setSavingThresholds(sensorId);
      await apiClient.updateSensorThresholds(sensorId, sensorThresholds[sensorId]);
      toast({
        title: 'Seuils mis à jour',
        description: 'Les seuils du capteur ont été sauvegardés avec succès.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les seuils.',
        variant: 'destructive',
      });
    } finally {
      setSavingThresholds(null);
    }
  };

  return (
    <AppLayout title="Paramètres" subtitle="Gérer votre organisation et vos préférences">
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-muted/50">
            <TabsTrigger value="general" className="gap-2">
              <Building className="w-4 h-4" />
              Général
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="w-4 h-4" />
              Alertes
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4" />
              Apparence
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Plug className="w-4 h-4" />
              Intégrations
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Organisation</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Nom de l'Organisation</Label>
                      <Input id="orgName" defaultValue="Acme Corporation" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Fuseau Horaire</Label>
                      <Input id="timezone" defaultValue="Europe/London" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input id="address" defaultValue="123 Business Street, London" />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Conservation des Données</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Conserver les données historiques</p>
                      <p className="text-sm text-muted-foreground">Combien de temps conserver les lectures des capteurs</p>
                    </div>
                    <select className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground">
                      <option>1 an</option>
                      <option>2 ans</option>
                      <option>Toujours</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Exporter automatiquement les rapports</p>
                      <p className="text-sm text-muted-foreground">Générer automatiquement des rapports hebdomadaires</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Alert Settings */}
          <TabsContent value="alerts">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Gauge className="w-5 h-5" />
                  Seuils d'Alerte par Capteur
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configurez des seuils personnalisés pour chaque capteur. Laissez vide pour utiliser les valeurs par défaut (CO₂: 1200 ppm, Temp: 15-28°C, Humidité: 80%).
                </p>
                
                <div className="space-y-4">
                  {sensors.map((sensor) => (
                    <div key={sensor.id} className="p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-foreground">{sensor.name}</p>
                          <p className="text-xs text-muted-foreground">{sensor.location}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">CO₂ Max (ppm)</Label>
                          <Input 
                            type="number" 
                            placeholder="1200"
                            value={sensorThresholds[sensor.id]?.co2 ?? ''}
                            onChange={(e) => handleThresholdChange(sensor.id, 'co2', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Temp Min (°C)</Label>
                          <Input 
                            type="number" 
                            placeholder="15"
                            value={sensorThresholds[sensor.id]?.temp_min ?? ''}
                            onChange={(e) => handleThresholdChange(sensor.id, 'temp_min', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Temp Max (°C)</Label>
                          <Input 
                            type="number" 
                            placeholder="28"
                            value={sensorThresholds[sensor.id]?.temp_max ?? ''}
                            onChange={(e) => handleThresholdChange(sensor.id, 'temp_max', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Humidité Max (%)</Label>
                          <Input 
                            type="number" 
                            placeholder="80"
                            value={sensorThresholds[sensor.id]?.humidity ?? ''}
                            onChange={(e) => handleThresholdChange(sensor.id, 'humidity', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="mt-3"
                        onClick={() => handleSaveThresholds(sensor.id)}
                        disabled={savingThresholds === sensor.id}
                      >
                        {savingThresholds === sensor.id ? 'Sauvegarde...' : 'Sauvegarder'}
                      </Button>
                    </div>
                  ))}
                  
                  {sensors.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucun capteur configuré. Ajoutez un capteur depuis le tableau de bord.
                    </p>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Canaux de Notification</h3>
                
                <div className="space-y-4">
                  {[
                    { name: 'Notifications par Email', description: 'Recevoir les alertes par email' },
                    { name: 'Notifications In-App', description: 'Afficher les alertes dans le tableau de bord' },
                    { name: 'Intégration Slack', description: 'Publier les alertes sur un canal Slack' },
                    { name: 'Webhook', description: 'Envoyer les alertes vers un point de terminaison personnalisé' }
                  ].map((channel, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-foreground">{channel.name}</p>
                        <p className="text-sm text-muted-foreground">{channel.description}</p>
                      </div>
                      <Switch defaultChecked={index < 2} />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Thème</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => theme !== 'dark' && toggleTheme()}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      theme === 'dark' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Moon className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">Mode Sombre</span>
                    </div>
                    <div className="h-20 rounded-lg bg-[#0B1220] border border-[#1E2A4A]">
                      <div className="p-2 space-y-1">
                        <div className="h-2 w-12 bg-[#2FE6D6] rounded" />
                        <div className="h-1.5 w-20 bg-[#9FB0D0] rounded opacity-50" />
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => theme !== 'light' && toggleTheme()}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      theme === 'light' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Sun className="w-5 h-5 text-warning" />
                      <span className="font-medium text-foreground">Mode Clair</span>
                    </div>
                    <div className="h-20 rounded-lg bg-white border border-gray-200">
                      <div className="p-2 space-y-1">
                        <div className="h-2 w-12 bg-[#0D9488] rounded" />
                        <div className="h-1.5 w-20 bg-gray-400 rounded opacity-50" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Préférences d'Affichage</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Mode Compact</p>
                      <p className="text-sm text-muted-foreground">Réduire l'espacement pour plus de densité de données</p>
                    </div>
                    <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Afficher les Animations</p>
                      <p className="text-sm text-muted-foreground">Activer les transitions et effets fluides</p>
                    </div>
                    <Switch checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Users Settings */}
          <TabsContent value="users">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl bg-card border border-border"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Membres de l'Équipe</h3>
                <Button size="sm" className="gradient-primary text-primary-foreground">
                  Inviter un Utilisateur
                </Button>
              </div>

              <div className="space-y-3">
                {loadingUsers ? (
                  <div className="text-sm text-muted-foreground">Chargement des utilisateurs...</div>
                ) : users.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Aucun utilisateur trouvé</div>
                ) : (
                  users.map((user, index) => (
                    <div key={user.id || index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-medium">{user.full_name?.charAt(0) || user.email.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.full_name || 'Sans nom'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-2 py-1 text-xs rounded-full",
                        user.role === 'admin' ? 'bg-primary/10 text-primary' :
                        user.role === 'user' ? 'bg-warning/10 text-warning' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {user.role === 'admin' ? 'Admin' : user.role === 'user' ? 'Utilisateur' : user.role}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
             {/* Backend Status Widget */}
             <BackendStatusWidget />
 
              {[
                { name: 'Slack', description: 'Envoyer les alertes sur des canaux Slack', connected: true },
                { name: 'Google Home', description: 'Commandes vocales et intégration domotique', connected: false },
                { name: 'Webhooks', description: 'Points de terminaison HTTP personnalisés pour les alertes', connected: true },
                { name: 'IFTTT', description: 'Se connecter à des milliers d\'applications', connected: false }
              ].map((integration, index) => (
                <div key={index} className="flex items-center justify-between p-5 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Plug className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                  <Button variant={integration.connected ? 'outline' : 'default'} size="sm">
                    {integration.connected ? 'Configurer' : 'Connecter'}
                  </Button>
                </div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;

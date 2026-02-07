import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Radio, 
  Thermometer, 
  Droplets, 
  Activity,
  Settings2,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  Wifi,
  Battery,
  MapPin,
  Trash2,
  Edit
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/apiClient';
import { useSensors } from '@/hooks/useSensors';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SensorData {
  id: string;
  name: string;
  location: string;
  status: 'en ligne' | 'hors ligne' | 'avertissement';
  co2: number;
  temperature: number;
  humidity: number;
  battery?: number;
  sensor_type: string;
  is_live: boolean;
  created_at: string;
  updated_at: string;
}

interface Reading {
  id: number;
  sensor_id: number;
  co2: number;
  temperature: number;
  humidity: number;
  recorded_at: string;
}

const calibrationSettings = {
  co2Offset: 0,
  temperatureOffset: 0,
  humidityOffset: 0,
  samplingInterval: 30,
  transmitInterval: 60,
};

const SensorDetail = () => {
  const { sensorId } = useParams();
  const navigate = useNavigate();
  const { socket } = useWebSocket();
  const { deleteSensor } = useSensors();
  
  const [sensor, setSensor] = useState<SensorData | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [calibration, setCalibration] = useState(calibrationSettings);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');

  // Fetch sensor data
  useEffect(() => {
    const fetchSensorData = async () => {
      if (!sensorId) return;
      
      try {
        setIsLoading(true);
        const sensorData = await apiClient.getSensor(sensorId);
        setSensor(sensorData);
        setEditName(sensorData.name);
        setEditLocation(sensorData.location);
      } catch (error) {
        console.error('Error fetching sensor:', error);
        toast.error('Erreur lors du chargement du capteur');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSensorData();
  }, [sensorId]);

  // Fetch historical readings
  useEffect(() => {
    const fetchReadings = async () => {
      if (!sensorId) return;

      const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      
      try {
        const readingsData = await apiClient.getSensorReadings(sensorId, hours, 500);
        setReadings(readingsData);
      } catch (error) {
        console.error('Error fetching readings:', error);
      }
    };

    fetchReadings();
  }, [sensorId, timeRange]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (!socket || !sensorId) return;

    const handleUpdate = (data: any) => {
      const normalizedSensorId = Number(data.sensor_id);
      if (normalizedSensorId === Number(sensorId)) {
        const { reading } = data;
        
        // Update sensor with latest reading
        setSensor(prev => prev ? {
          ...prev,
          co2: reading.co2,
          temperature: reading.temperature,
          humidity: reading.humidity,
        } : null);

        // Add new reading to the list
        setReadings(prev => [{
          id: Date.now(),
          sensor_id: Number(sensorId),
          co2: reading.co2,
          temperature: reading.temperature,
          humidity: reading.humidity,
          recorded_at: reading.recorded_at,
        }, ...prev.slice(0, 499)]);
      }
    };

    socket.on('sensor_update', handleUpdate);
    return () => {
      socket.off('sensor_update', handleUpdate);
    };
  }, [socket, sensorId]);

  const chartData = useMemo(() => {
    return readings
      .slice()
      .reverse()
      .map(reading => ({
        time: format(new Date(reading.recorded_at), 'HH:mm'),
        co2: reading.co2,
        temperature: reading.temperature,
        humidity: reading.humidity,
      }));
  }, [readings]);

  const handleCalibrate = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      setIsCalibrating(false);
      toast.success('Étalonnage appliqué avec succès');
    }, 2000);
  };

  const handleSaveEdit = async () => {
    if (!sensorId) return;
    
    try {
      await apiClient.updateSensor(sensorId, {
        name: editName,
        location: editLocation,
      });
      
      setSensor(prev => prev ? {
        ...prev,
        name: editName,
        location: editLocation,
      } : null);
      
      setIsEditing(false);
      toast.success('Capteur mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async () => {
    if (!sensorId) return;
    
    try {
      await deleteSensor(sensorId);
      toast.success('Capteur supprimé');
      navigate('/sensors');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleExport = () => {
    if (!sensor || readings.length === 0) return;

    const csvContent = [
      ['Date/Heure', 'CO2 (ppm)', 'Température (°C)', 'Humidité (%)'].join(','),
      ...readings.map(r => [
        new Date(r.recorded_at).toISOString(),
        r.co2,
        r.temperature,
        r.humidity
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sensor.name.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Données exportées');
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
          <p className="text-sm text-muted-foreground">{payload[0]?.payload?.time}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.name === 'co2' ? 'CO₂' : entry.name === 'temperature' ? 'Temp' : 'Humidité'}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
              {entry.name === 'co2' ? ' ppm' : entry.name === 'temperature' ? '°C' : '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="kpi" count={4} />
          <LoadingSkeleton variant="chart" count={1} />
        </div>
      </AppLayout>
    );
  }

  if (!sensor) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <AlertTriangle className="w-12 h-12 text-warning mb-4" />
          <h2 className="text-xl font-semibold mb-2">Capteur non trouvé</h2>
          <p className="text-muted-foreground mb-4">Le capteur demandé n'existe pas ou vous n'y avez pas accès.</p>
          <Button onClick={() => navigate('/sensors')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux capteurs
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/sensors')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nom du capteur"
                  className="max-w-xs"
                />
                <Input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="Emplacement"
                  className="max-w-xs"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>Sauvegarder</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Annuler</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">{sensor.name}</h1>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      sensor.status === 'en ligne' 
                        ? 'bg-success/20 text-success border-success/30' 
                        : sensor.status === 'avertissement'
                        ? 'bg-warning/20 text-warning border-warning/30'
                        : 'bg-destructive/20 text-destructive border-destructive/30'
                    )}
                  >
                    {sensor.status === 'en ligne' ? 'En Ligne' : sensor.status === 'avertissement' ? 'Avertissement' : 'Hors Ligne'}
                  </Badge>
                  <Badge variant="outline" className="bg-muted">
                    {sensor.sensor_type === 'real' ? 'Capteur Réel' : 'Simulation'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{sensor.location}</span>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce capteur ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Toutes les données associées seront supprimées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Live Readings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'CO₂', value: sensor.co2 || 0, unit: 'ppm', icon: Activity, color: 'text-primary' },
            { label: 'Température', value: (sensor.temperature || 0).toFixed(1), unit: '°C', icon: Thermometer, color: 'text-warning' },
            { label: 'Humidité', value: sensor.humidity || 0, unit: '%', icon: Droplets, color: 'text-blue-400' },
            { label: 'Batterie', value: sensor.battery ?? 100, unit: '%', icon: Battery, color: 'text-success' },
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <metric.icon className={cn("w-5 h-5", metric.color)} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="text-2xl font-bold text-foreground">
                        {metric.value}
                        <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Real Sensor Integration Info */}
        {sensor.sensor_type === 'real' && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Wifi className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">Endpoint pour capteur réel</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Envoyez les données de votre capteur SDC30 à l'URL suivante :
                  </p>
                  <code className="block mt-2 p-2 bg-muted rounded text-xs">
                    POST {window.location.origin.replace(':5173', ':5000').replace(':8080', ':5000')}/api/readings/external/{sensor.id}
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    Corps JSON : {`{ "co2": number, "temperature": number, "humidity": number }`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="history" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="history" className="gap-2">
              <Activity className="w-4 h-4" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="calibration" className="gap-2">
              <Settings2 className="w-4 h-4" />
              Étalonnage
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-2">
              <Cpu className="w-4 h-4" />
              Informations
            </TabsTrigger>
          </TabsList>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <CardTitle className="text-lg">Données Historiques</CardTitle>
                  <div className="flex gap-2">
                    {(['24h', '7d', '30d'] as const).map((range) => (
                      <Button
                        key={range}
                        variant={timeRange === range ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimeRange(range)}
                      >
                        {range}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    Aucune donnée disponible pour cette période
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis 
                          dataKey="time" 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          yAxisId="co2"
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                          domain={[400, 'auto']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          yAxisId="co2"
                          type="monotone"
                          dataKey="co2"
                          stroke="none"
                          fill="url(#co2Gradient)"
                        />
                        <Line
                          yAxisId="co2"
                          type="monotone"
                          dataKey="co2"
                          name="co2"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calibration Tab */}
          <TabsContent value="calibration">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Décalages des Capteurs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Décalage CO₂</Label>
                      <span className="text-sm text-muted-foreground">{calibration.co2Offset} ppm</span>
                    </div>
                    <Slider
                      value={[calibration.co2Offset]}
                      onValueChange={([value]) => setCalibration(prev => ({ ...prev, co2Offset: value }))}
                      min={-50}
                      max={50}
                      step={1}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Décalage Température</Label>
                      <span className="text-sm text-muted-foreground">{calibration.temperatureOffset}°C</span>
                    </div>
                    <Slider
                      value={[calibration.temperatureOffset]}
                      onValueChange={([value]) => setCalibration(prev => ({ ...prev, temperatureOffset: value }))}
                      min={-5}
                      max={5}
                      step={0.1}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Décalage Humidité</Label>
                      <span className="text-sm text-muted-foreground">{calibration.humidityOffset}%</span>
                    </div>
                    <Slider
                      value={[calibration.humidityOffset]}
                      onValueChange={([value]) => setCalibration(prev => ({ ...prev, humidityOffset: value }))}
                      min={-10}
                      max={10}
                      step={1}
                    />
                  </div>
                  <Button onClick={handleCalibrate} disabled={isCalibrating} className="w-full gap-2">
                    {isCalibrating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Étalonnage en cours...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Appliquer l'Étalonnage
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Paramètres d'Échantillonnage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="sampling">Intervalle d'Échantillonnage (secondes)</Label>
                    <Input
                      id="sampling"
                      type="number"
                      value={calibration.samplingInterval}
                      onChange={(e) => setCalibration(prev => ({ ...prev, samplingInterval: parseInt(e.target.value) || 30 }))}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transmit">Intervalle de Transmission (secondes)</Label>
                    <Input
                      id="transmit"
                      type="number"
                      value={calibration.transmitInterval}
                      onChange={(e) => setCalibration(prev => ({ ...prev, transmitInterval: parseInt(e.target.value) || 60 }))}
                      className="bg-background"
                    />
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Dernière mise à jour</span>
                    </div>
                    <p className="font-medium text-foreground">
                      {format(new Date(sensor.updated_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Informations sur l'Appareil</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {[
                      { label: 'Type', value: sensor.sensor_type === 'real' ? 'Capteur Physique (SDC30)' : 'Simulation', icon: Cpu },
                      { label: 'ID du Capteur', value: sensor.id, icon: Radio },
                      { label: 'Date de Création', value: format(new Date(sensor.created_at), 'dd/MM/yyyy'), icon: Clock },
                      { label: 'Dernière Activité', value: format(new Date(sensor.updated_at), 'dd/MM/yyyy HH:mm'), icon: Activity },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="p-2 rounded-lg bg-background">
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                          <p className="font-medium text-foreground">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">Statut de Connexion</span>
                        <div className="flex items-center gap-2">
                          {sensor.is_live ? (
                            <Wifi className="w-4 h-4 text-success" />
                          ) : (
                            <Wifi className="w-4 h-4 text-destructive" />
                          )}
                          <span className="font-medium text-foreground">
                            {sensor.is_live ? 'Connecté' : 'Déconnecté'}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full", sensor.is_live ? "bg-success" : "bg-destructive")} 
                          style={{ width: sensor.is_live ? '100%' : '0%' }}
                        />
                      </div>
                    </div>
                    
                    <div className={cn(
                      "p-4 rounded-lg border",
                      sensor.status === 'en ligne' 
                        ? "border-success/30 bg-success/5" 
                        : sensor.status === 'avertissement'
                        ? "border-warning/30 bg-warning/5"
                        : "border-destructive/30 bg-destructive/5"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className={cn(
                          "w-4 h-4",
                          sensor.status === 'en ligne' ? "text-success" : 
                          sensor.status === 'avertissement' ? "text-warning" : "text-destructive"
                        )} />
                        <span className={cn(
                          "font-medium",
                          sensor.status === 'en ligne' ? "text-success" : 
                          sensor.status === 'avertissement' ? "text-warning" : "text-destructive"
                        )}>
                          {sensor.status === 'en ligne' ? 'Fonctionnement Normal' : 
                           sensor.status === 'avertissement' ? 'Avertissement Actif' : 'Hors Ligne'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {sensor.status === 'en ligne' 
                          ? 'Votre capteur fonctionne correctement et transmet des données.' 
                          : sensor.status === 'avertissement'
                          ? 'Des valeurs anormales ont été détectées. Vérifiez l\'environnement.'
                          : 'Le capteur ne transmet plus de données. Vérifiez la connexion.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-2">Nombre de lectures</p>
                      <p className="text-2xl font-bold text-foreground">{readings.length}</p>
                      <p className="text-xs text-muted-foreground">dans la période sélectionnée</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SensorDetail;

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Radio, Wifi, WifiOff, ThermometerSun, Droplets, Wind, Search, Filter, List, Grid3X3 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sensor } from '@/lib/sensorData';
import { cn } from '@/lib/utils';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { useSensors } from '@/hooks/useSensors';

const SensorMap = () => {
  const { sensors, isLoading } = useSensors();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);

  const filteredSensors = sensors.filter(sensor => {
    const matchesSearch = sensor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sensor.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sensor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en ligne': return 'bg-success text-success-foreground';
      case 'avertissement': return 'bg-warning text-warning-foreground';
      case 'hors ligne': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en ligne': return 'En Ligne';
      case 'avertissement': return 'Avertissement';
      case 'hors ligne': return 'Hors Ligne';
      default: return status;
    }
  };

  return (
     <AppLayout title="Carte des Capteurs" subtitle="Visualisez l'emplacement de tous vos capteurs">
       <div className="space-y-6" data-tour="map-page">
        {/* Controls */}
         <div className="flex flex-col sm:flex-row gap-4 justify-between" data-tour="map-filters">
           <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un capteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en ligne">En Ligne</SelectItem>
                <SelectItem value="avertissement">Avertissement</SelectItem>
                <SelectItem value="hors ligne">Hors Ligne</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="flex gap-2" data-tour="map-grid">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Map Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative h-80 rounded-xl bg-card border border-border overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-primary mx-auto mb-3" />
                <p className="text-lg font-medium text-foreground">Carte Interactive</p>
                <p className="text-sm text-muted-foreground">La carte sera disponible prochainement</p>
              </div>
            </div>
            {/* Mock sensor pins */}
            {filteredSensors.slice(0, 5).map((sensor, index) => (
              <div
                key={sensor.id}
                className={cn(
                  "absolute w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110",
                  sensor.status === 'en ligne' ? 'bg-success' : 
                  sensor.status === 'avertissement' ? 'bg-warning' : 'bg-destructive'
                )}
                style={{
                  top: `${20 + (index * 15)}%`,
                  left: `${15 + (index * 18)}%`,
                }}
                onClick={() => setSelectedSensor(sensor)}
              >
                <Radio className="w-4 h-4 text-white" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sensors Grid/List */}
        {isLoading ? (
          <LoadingSkeleton variant="sensor" count={6} />
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
           )}
           data-tour="map-sensors"
           >
            {filteredSensors.map((sensor, index) => (
              <motion.div
                key={sensor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer",
                  selectedSensor?.id === sensor.id && "border-primary ring-1 ring-primary"
                )}
                onClick={() => setSelectedSensor(sensor)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      sensor.status === 'en ligne' ? 'bg-success/10' : 
                      sensor.status === 'avertissement' ? 'bg-warning/10' : 'bg-destructive/10'
                    )}>
                      {sensor.status === 'en ligne' ? (
                        <Wifi className="w-5 h-5 text-success" />
                      ) : (
                        <WifiOff className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{sensor.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {sensor.location}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(sensor.status)}>
                    {getStatusLabel(sensor.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <Wind className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold text-foreground">{sensor.co2}</p>
                    <p className="text-xs text-muted-foreground">ppm CO₂</p>
                  </div>
                  <div className="text-center">
                    <ThermometerSun className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold text-foreground">{sensor.temperature}°</p>
                    <p className="text-xs text-muted-foreground">Temp.</p>
                  </div>
                  <div className="text-center">
                    <Droplets className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold text-foreground">{sensor.humidity}%</p>
                    <p className="text-xs text-muted-foreground">Humidité</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {filteredSensors.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Radio className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium text-foreground">Aucun capteur trouvé</p>
            <p className="text-muted-foreground">Modifiez vos critères de recherche</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default SensorMap;

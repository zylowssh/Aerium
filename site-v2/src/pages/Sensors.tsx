import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
import { Plus, Radio, MapPin, Battery, Edit, Trash2, MoreHorizontal, Grid, List, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { useSensors } from '@/hooks/useSensors';
import { Sensor } from '@/lib/sensorData';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddSensorDialog from '@/components/sensors/AddSensorDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Sensors = () => {
  const { sensors, isLoading } = useSensors();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const navigate = useNavigate();

  const StatusBadge = ({ status }: { status: Sensor['status'] }) => {
    const styles = {
      'en ligne': 'bg-success/10 border-success/30 text-success',
      'hors ligne': 'bg-muted border-muted-foreground/30 text-muted-foreground',
      'avertissement': 'bg-warning/10 border-warning/30 text-warning'
    };

    const labels = {
      'en ligne': 'En Ligne',
      'hors ligne': 'Hors Ligne',
      'avertissement': 'Avertissement'
    };

    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border",
        styles[status]
      )}>
        <span className={cn("w-1.5 h-1.5 rounded-full", {
          'bg-success': status === 'en ligne',
          'bg-muted-foreground': status === 'hors ligne',
          'bg-warning': status === 'avertissement'
        })} />
        {labels[status]}
      </span>
    );
  };

  return (
     <AppLayout title="Capteurs" subtitle="Gérer vos appareils de surveillance">
       <div className="space-y-6" data-tour="sensors-page">
        {/* Controls */}
         <div className="flex items-center justify-between" data-tour="sensors-filters">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Tous les Capteurs
            </Button>
            <Button variant="outline" size="sm">Salle</Button>
            <Button variant="outline" size="sm">Statut</Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-border rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === 'grid' ? 'bg-muted' : 'hover:bg-muted/50'
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === 'list' ? 'bg-muted' : 'hover:bg-muted/50'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <Button 
              size="sm" 
              className="gap-2 gradient-primary text-primary-foreground"
              onClick={() => setIsAddDialogOpen(true)}
               data-tour="sensors-add"
            >
              <Plus className="w-4 h-4" />
              Ajouter un Capteur
            </Button>
          </div>
        </div>

        {/* Add Sensor Dialog */}
        <AddSensorDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />

        {/* Sensors Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
           className="rounded-xl border border-border bg-card overflow-hidden"
           data-tour="sensors-table"
        >
          {isLoading ? (
            <LoadingSkeleton variant="table" count={5} />
          ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Statistiques de l'Appareil</TableHead>
                <TableHead className="text-muted-foreground">Salle</TableHead>
                <TableHead className="text-muted-foreground">Emplacement</TableHead>
                <TableHead className="text-muted-foreground text-right">CO₂</TableHead>
                <TableHead className="text-muted-foreground text-right">Température</TableHead>
                <TableHead className="text-muted-foreground text-right">Humidité</TableHead>
                <TableHead className="text-muted-foreground text-center">Capteur</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Chargement des capteurs...
                  </TableCell>
                </TableRow>
              ) : sensors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Aucun capteur trouvé. Cliquez sur "Ajouter un Capteur" pour commencer.
                  </TableCell>
                </TableRow>
              ) : (
                sensors.map((sensor, index) => (
                <TableRow 
                  key={sensor.id} 
                  className="border-border hover:bg-muted/30 cursor-pointer"
                  onClick={() => navigate(`/sensors/${sensor.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        sensor.status === 'en ligne' ? 'bg-primary/10' : 
                        sensor.status === 'avertissement' ? 'bg-warning/10' : 'bg-muted'
                      )}>
                        <Radio className={cn(
                          "w-4 h-4",
                          sensor.status === 'en ligne' ? 'text-primary' : 
                          sensor.status === 'avertissement' ? 'text-warning' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{sensor.name}</p>
                        <p className="text-xs text-muted-foreground">{sensor.location}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={sensor.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    Building A, Floor 1<br />
                    <span className="text-xs">Supermini</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "font-semibold",
                      sensor.co2 < 800 ? 'text-primary' : 
                      sensor.co2 < 1000 ? 'text-warning' : 'text-destructive'
                    )}>
                      {sensor.co2}
                    </span>
                    <span className="text-muted-foreground ml-1">ppm</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-foreground">{sensor.temperature}</span>
                    <span className="text-muted-foreground">°C</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-foreground">{sensor.humidity}</span>
                    <span className="text-muted-foreground">%</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Radio className="w-3.5 h-3.5" />
                      Capteurs
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/sensors/${sensor.id}`); }}>Voir les Détails</DropdownMenuItem>
                          <DropdownMenuItem>Étalonner</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
          )}
        </motion.div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total des Capteurs', value: sensors.length, icon: Radio },
            { label: 'En Ligne', value: sensors.filter(s => s.status === 'en ligne').length, color: 'text-success' },
            { label: 'Avertissements', value: sensors.filter(s => s.status === 'avertissement').length, color: 'text-warning' },
            { label: 'Hors Ligne', value: sensors.filter(s => s.status === 'hors ligne').length, color: 'text-muted-foreground' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className="p-4 rounded-xl bg-card border border-border"
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={cn("text-2xl font-bold mt-1", stat.color || 'text-foreground')}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Sensors;

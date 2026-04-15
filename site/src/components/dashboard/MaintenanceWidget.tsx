import { motion } from 'framer-motion';
import { Wrench, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Skeleton } from '@/components/ui/skeleton';

interface MaintenanceItem {
  id: string;
  sensorName: string;
  type: 'scheduled' | 'required' | 'completed';
  date: string;
  description: string;
}

export function MaintenanceWidget() {
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      setLoading(true);
      // Get upcoming scheduled and overdue maintenance
      const scheduled = await apiClient.getMaintenance('scheduled', undefined, 5);
      const overdue = await apiClient.getMaintenance('overdue', undefined, 5);
      const inProgress = await apiClient.getMaintenance('in_progress', undefined, 3);
      
      const maintenanceItems: MaintenanceItem[] = [];
      
      // Add overdue items first (highest priority)
      overdue.forEach((task: any) => {
        maintenanceItems.push({
          id: task.id,
          sensorName: task.sensorName,
          type: 'required',
          date: 'En retard',
          description: `${task.type} - ${task.description || 'Priorité haute'}`
        });
      });
      
      // Add in progress
      inProgress.forEach((task: any) => {
        maintenanceItems.push({
          id: task.id,
          sensorName: task.sensorName,
          type: 'scheduled',
          date: new Date(task.scheduledDate).toLocaleDateString('fr-FR'),
          description: `${task.type} - ${task.description || 'En cours'}`
        });
      });
      
      // Add scheduled
      scheduled.forEach((task: any) => {
        if (maintenanceItems.length < 5) {
          maintenanceItems.push({
            id: task.id,
            sensorName: task.sensorName,
            type: 'scheduled',
            date: `Dans ${Math.ceil((new Date(task.scheduledDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} jours`,
            description: `${task.type} - ${task.description || 'Planifié'}`
          });
        }
      });
      
      // Add a completed item for context
      const completed = await apiClient.getMaintenance('completed', undefined, 1);
      if (completed.length > 0) {
        const task = completed[0];
        maintenanceItems.push({
          id: `comp-${task.id}`,
          sensorName: task.sensorName,
          type: 'completed',
          date: new Date(task.completedDate || task.updatedAt).toLocaleDateString('fr-FR'),
          description: `${task.type} - Terminée`
        });
      }
      
      setItems(maintenanceItems);
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: MaintenanceItem['type']) => {
    switch (type) {
      case 'scheduled': return <Calendar className="h-4 w-4 text-primary" />;
      case 'required': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    }
  };

  const getStatusColor = (type: MaintenanceItem['type']) => {
    switch (type) {
      case 'scheduled': return 'border-primary/30 bg-primary/10';
      case 'required': return 'border-amber-500/30 bg-amber-500/10';
      case 'completed': return 'border-emerald-500/30 bg-emerald-500/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/80 p-4 md:p-5',
        'bg-card/70 backdrop-blur-sm supports-[backdrop-filter]:bg-card/55'
      )}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            Opérations
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Maintenance</h3>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          <Clock className="h-3 w-3 inline mr-1" />
          {items.length > 0 ? 'Actif' : 'À jour'}
        </span>
      </div>

      <div className="relative space-y-2.5">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-border/70 bg-background/55 p-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/70 bg-background/45 p-3 text-xs text-muted-foreground">
            Aucune maintenance requise
          </div>
        ) : (
          items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:border-primary/35',
                getStatusColor(item.type)
              )}
            >
              {getIcon(item.type)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {item.sensorName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.description}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {item.date}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

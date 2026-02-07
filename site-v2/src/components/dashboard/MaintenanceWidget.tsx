import { motion } from 'framer-motion';
import { Wrench, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';

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
      
      setItems(maintenanceItems.length > 0 ? maintenanceItems : getDefaultItems());
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      setItems(getDefaultItems());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultItems = (): MaintenanceItem[] => [
    { id: '1', sensorName: 'Aucun capteur', type: 'scheduled', date: 'N/A', description: 'Ajouter des capteurs' },
  ];

  const getIcon = (type: MaintenanceItem['type']) => {
    switch (type) {
      case 'scheduled': return <Calendar className="h-4 w-4 text-primary" />;
      case 'required': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    }
  };

  const getStatusColor = (type: MaintenanceItem['type']) => {
    switch (type) {
      case 'scheduled': return 'border-primary/30 bg-primary/5';
      case 'required': return 'border-amber-500/30 bg-amber-500/5';
      case 'completed': return 'border-emerald-500/30 bg-emerald-500/5';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-border p-4 overflow-hidden',
        'bg-card/50 backdrop-blur-sm'
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Maintenance</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          <Clock className="h-3 w-3 inline mr-1" />
          {items.length > 0 ? 'Actif' : 'À jour'}
        </span>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-xs text-muted-foreground">Chargement...</div>
        ) : items.length === 0 ? (
          <div className="text-xs text-muted-foreground">Aucune maintenance requise</div>
        ) : (
          items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-lg border',
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

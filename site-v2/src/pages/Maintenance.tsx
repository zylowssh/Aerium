import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Wrench, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Search,
  MoreHorizontal
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface MaintenanceTask {
  id: string;
  sensorName: string;
  type: string;
  status: string;
  scheduledDate: string;
  priority: string;
  description?: string;
  notes?: string;
}

interface Stats {
  scheduled: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

interface SensorOption {
  id: string;
  name: string;
}

interface MaintenanceFormData {
  sensorId: string;
  type: string;
  scheduledDate: string;
  priority: 'low' | 'normal' | 'high';
  description: string;
  notes: string;
}

const normalizeMaintenanceStatus = (status: string): string => {
  switch ((status || '').toLowerCase()) {
    case 'planifié':
    case 'planifie':
    case 'scheduled':
      return 'scheduled';
    case 'en_cours':
    case 'in_progress':
      return 'in_progress';
    case 'terminé':
    case 'termine':
    case 'completed':
      return 'completed';
    case 'en retard':
    case 'en_retard':
    case 'overdue':
      return 'overdue';
    default:
      return status || 'scheduled';
  }
};

const normalizeMaintenancePriority = (priority: string): string => {
  switch ((priority || '').toLowerCase()) {
    case 'élevé':
    case 'eleve':
    case 'high':
      return 'high';
    case 'bas':
    case 'low':
      return 'low';
    default:
      return 'normal';
  }
};

const normalizeMaintenanceTask = (task: any): MaintenanceTask => ({
  id: String(task?.id ?? ''),
  sensorName: task?.sensorName || 'Capteur inconnu',
  type: String(task?.type || 'Maintenance'),
  status: normalizeMaintenanceStatus(task?.status),
  scheduledDate: task?.scheduledDate || task?.scheduled_date || new Date().toISOString(),
  priority: normalizeMaintenancePriority(task?.priority),
  description: task?.description || '',
  notes: task?.notes || '',
});

const toLocalDateTimeInput = (isoDate?: string): string => {
  const base = isoDate ? new Date(isoDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const offsetMs = base.getTimezoneOffset() * 60 * 1000;
  return new Date(base.getTime() - offsetMs).toISOString().slice(0, 16);
};

const Maintenance = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [sensors, setSensors] = useState<SensorOption[]>([]);
  const [stats, setStats] = useState<Stats>({ scheduled: 0, inProgress: 0, completed: 0, overdue: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [form, setForm] = useState<MaintenanceFormData>({
    sensorId: '',
    type: 'inspection',
    scheduledDate: toLocalDateTimeInput(),
    priority: 'normal',
    description: '',
    notes: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      setLoading(true);
      
      const [allTasks, sensorsData] = await Promise.all([
        apiClient.getMaintenance(undefined, undefined, 100),
        apiClient.getSensors(),
      ]);

      const sensorOptions: SensorOption[] = (sensorsData || []).map((s: any) => ({
        id: String(s.id),
        name: s.name || `Capteur ${s.id}`,
      }));
      setSensors(sensorOptions);

      const nowMs = Date.now();
      const normalizedTasks = (allTasks || [])
        .map(normalizeMaintenanceTask)
        .map((task: MaintenanceTask) => {
          const dueMs = new Date(task.scheduledDate).getTime();
          if (task.status !== 'completed' && !Number.isNaN(dueMs) && dueMs < nowMs) {
            return { ...task, status: 'overdue' };
          }
          return task;
        })
        .sort((a: MaintenanceTask, b: MaintenanceTask) =>
          new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
        );
      
      // Calculate stats
      const statsData: Stats = { scheduled: 0, inProgress: 0, completed: 0, overdue: 0 };
      
      normalizedTasks.forEach((task: MaintenanceTask) => {
        if (task.status === 'scheduled') statsData.scheduled++;
        else if (task.status === 'in_progress') statsData.inProgress++;
        else if (task.status === 'completed') statsData.completed++;
        else if (task.status === 'overdue') statsData.overdue++;
      });
      
      setStats(statsData);
      setTasks(normalizedTasks);

      if (sensorOptions.length > 0) {
        setForm((prev) =>
          prev.sensorId
            ? prev
            : {
                ...prev,
                sensorId: sensorOptions[0].id,
              }
        );
      }
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      setTasks([]);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la maintenance.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingTaskId(null);
    setForm({
      sensorId: sensors[0]?.id || '',
      type: 'inspection',
      scheduledDate: toLocalDateTimeInput(),
      priority: 'normal',
      description: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = async (taskId: string) => {
    try {
      const details = await apiClient.getMaintenanceTask(Number(taskId));
      const task = normalizeMaintenanceTask(details);
      setEditingTaskId(taskId);
      setForm({
        sensorId: String(details?.sensorId ?? ''),
        type: task.type,
        scheduledDate: toLocalDateTimeInput(task.scheduledDate),
        priority: (task.priority as 'low' | 'normal' | 'high') || 'normal',
        description: task.description || '',
        notes: task.notes || '',
      });
      setDialogOpen(true);
    } catch (error) {
      console.error('Error loading maintenance task details:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails de la tâche.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveTask = async () => {
    if (!form.sensorId || !form.type || !form.scheduledDate) {
      toast({
        title: 'Champs manquants',
        description: 'Veuillez remplir les champs obligatoires.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        sensorId: Number(form.sensorId),
        type: form.type.trim(),
        scheduledDate: new Date(form.scheduledDate).toISOString(),
        priority: form.priority,
        description: form.description.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      if (editingTaskId) {
        await apiClient.updateMaintenance(Number(editingTaskId), payload);
        toast({
          title: 'Tâche mise à jour',
          description: 'La maintenance a été modifiée avec succès.',
        });
      } else {
        await apiClient.createMaintenance({ ...payload, status: 'scheduled' });
        toast({
          title: 'Tâche créée',
          description: 'La maintenance a été ajoutée avec succès.',
        });
      }

      setDialogOpen(false);
      await fetchMaintenanceData();
    } catch (error) {
      console.error('Error saving maintenance task:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d’enregistrer la tâche.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetails = async (taskId: string) => {
    try {
      const details = await apiClient.getMaintenanceTask(Number(taskId));
      const task = normalizeMaintenanceTask(details);
      toast({
        title: `${task.sensorName} - ${task.type}`,
        description: task.description || 'Aucune description.',
      });
    } catch (error) {
      console.error('Error loading details:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (taskId: string, status: 'scheduled' | 'in_progress' | 'completed') => {
    try {
      await apiClient.updateMaintenance(Number(taskId), { status });
      toast({
        title: 'Statut mis à jour',
        description: `La tâche est maintenant ${getStatusLabel(status).toLowerCase()}.`,
      });
      await fetchMaintenanceData();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Supprimer cette tâche de maintenance ?')) {
      return;
    }

    try {
      await apiClient.deleteMaintenance(Number(taskId));
      toast({
        title: 'Tâche supprimée',
        description: 'La tâche de maintenance a été supprimée.',
      });
      await fetchMaintenanceData();
    } catch (error) {
      console.error('Error deleting maintenance task:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la tâche.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/30';
      case 'in_progress': return 'bg-warning/10 text-warning border-warning/30';
      case 'scheduled': return 'bg-primary/10 text-primary border-primary/30';
      case 'overdue': return 'bg-destructive/10 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'normal': return 'bg-muted text-muted-foreground border-border';
      case 'low': return 'bg-success/10 text-success border-success/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.sensorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'scheduled': 'Planifié',
      'in_progress': 'En cours',
      'completed': 'Terminé',
      'overdue': 'En retard'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      'high': 'Haute',
      'normal': 'Normale',
      'low': 'Basse'
    };
    return labels[priority] || priority;
  };

  const upcomingTasks = tasks
    .filter(t => t.status === 'scheduled' || t.status === 'in_progress')
    .filter(t => new Date(t.scheduledDate).getTime() >= Date.now())
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 5);

  const getDaysLeft = (date: string) => {
    const now = new Date();
    const targetDate = new Date(date);
    const daysLeft = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  return (
    <AppLayout title="Maintenance" subtitle="Planifiez et suivez la maintenance de vos capteurs">
      <div className="space-y-6">
        {loading ? (
          <>
            <LoadingSkeleton variant="kpi" count={4} />
            <LoadingSkeleton variant="table" count={5} />
          </>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
              >
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg bg-muted")}>
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Planifiées</p>
                        <p className="text-2xl font-bold text-foreground">{stats.scheduled}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg bg-muted")}>
                        <Clock className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">En cours</p>
                        <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg bg-muted")}>
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Terminées</p>
                        <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg bg-muted")}>
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">En retard</p>
                        <p className="text-2xl font-bold text-foreground">{stats.overdue}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Maintenance Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2"
              >
                <Card className="bg-card border-border">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                      <CardTitle>Tâches de Maintenance</CardTitle>
                      <div className="flex gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Rechercher..."
                            className="pl-9 w-48"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <Button className="gap-2" onClick={openCreateDialog} disabled={sensors.length === 0}>
                          <Plus className="w-4 h-4" />
                          Nouvelle Tâche
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead>Capteur</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Priorité</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTasks.map((task) => (
                            <TableRow key={task.id} className="hover:bg-muted/30">
                              <TableCell className="font-medium text-foreground">{task.sensorName}</TableCell>
                              <TableCell className="text-muted-foreground">{task.type}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("capitalize", getStatusBadge(task.status))}>
                                  {getStatusLabel(task.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("capitalize", getPriorityBadge(task.priority))}>
                                  {getPriorityLabel(task.priority)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(task.scheduledDate).toLocaleDateString('fr-FR')}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewDetails(task.id)}>Voir Détails</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openEditDialog(task.id)}>Modifier</DropdownMenuItem>
                                    {task.status !== 'in_progress' && task.status !== 'completed' && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'in_progress')}>
                                        Marquer En cours
                                      </DropdownMenuItem>
                                    )}
                                    {task.status !== 'completed' && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'completed')}>
                                        Marquer Terminé
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTask(task.id)}>
                                      Supprimer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredTasks.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                                Aucune tâche de maintenance trouvée
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Upcoming Maintenance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Prochaines Échéances
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {upcomingTasks.map((task, index) => {
                      const daysLeft = getDaysLeft(task.scheduledDate);
                      return (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            daysLeft <= 3 ? "bg-destructive/10" : 
                            daysLeft <= 7 ? "bg-warning/10" : "bg-muted"
                          )}>
                            <Wrench className={cn(
                              "w-5 h-5",
                              daysLeft <= 3 ? "text-destructive" : 
                              daysLeft <= 7 ? "text-warning" : "text-muted-foreground"
                            )} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{task.sensorName}</p>
                            <p className="text-sm text-muted-foreground">{task.type}</p>
                          </div>
                          <Badge variant="outline" className={cn(
                            daysLeft <= 3 ? "bg-destructive/10 text-destructive" : 
                            daysLeft <= 7 ? "bg-warning/10 text-warning" : ""
                          )}>
                            {daysLeft > 0 ? `${daysLeft}j` : 'Maintenant'}
                          </Badge>
                        </div>
                      );
                    })}
                    {upcomingTasks.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        Aucune maintenance planifiée
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTaskId ? 'Modifier une tâche' : 'Nouvelle tâche de maintenance'}</DialogTitle>
              <DialogDescription>
                {editingTaskId
                  ? 'Mettez à jour les informations de la tâche.'
                  : 'Planifiez une intervention sur un capteur.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Capteur</label>
                <Select
                  value={form.sensorId}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, sensorId: value }))}
                  disabled={sensors.length === 0 || !!editingTaskId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un capteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {sensors.map((sensor) => (
                      <SelectItem key={sensor.id} value={sensor.id}>
                        {sensor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type de maintenance</label>
                <Input
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  placeholder="inspection, calibration, batterie..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date planifiée</label>
                <Input
                  type="datetime-local"
                  value={form.scheduledDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priorité</label>
                <Select
                  value={form.priority}
                  onValueChange={(value: 'low' | 'normal' | 'high') =>
                    setForm((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="normal">Normale</SelectItem>
                    <SelectItem value="low">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Détails de l’intervention"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informations complémentaires"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Annuler
              </Button>
              <Button onClick={handleSaveTask} disabled={saving || sensors.length === 0}>
                {saving ? 'Enregistrement...' : editingTaskId ? 'Enregistrer' : 'Créer la tâche'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Maintenance;

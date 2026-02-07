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
  Filter,
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
import { cn } from '@/lib/utils';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { apiClient } from '@/lib/apiClient';

interface MaintenanceTask {
  id: string;
  sensorName: string;
  type: string;
  status: string;
  scheduledDate: string;
  priority: string;
}

interface Stats {
  scheduled: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

const Maintenance = () => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [stats, setStats] = useState<Stats>({ scheduled: 0, inProgress: 0, completed: 0, overdue: 0 });

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch all maintenance tasks
      const allTasks = await apiClient.getMaintenance(undefined, undefined, 100);
      
      // Calculate stats
      const statsData: Stats = { scheduled: 0, inProgress: 0, completed: 0, overdue: 0 };
      
      allTasks.forEach((task: any) => {
        if (task.status === 'scheduled') statsData.scheduled++;
        else if (task.status === 'in_progress') statsData.inProgress++;
        else if (task.status === 'completed') statsData.completed++;
        else if (task.status === 'overdue') statsData.overdue++;
      });
      
      setStats(statsData);
      setTasks(allTasks);
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      setTasks([]);
    } finally {
      setLoading(false);
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
    .filter(t => t.status === 'scheduled')
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
                        <Button className="gap-2">
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
                                    <DropdownMenuItem>Voir Détails</DropdownMenuItem>
                                    <DropdownMenuItem>Modifier</DropdownMenuItem>
                                    <DropdownMenuItem>Marquer Terminé</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">Annuler</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
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
      </div>
    </AppLayout>
  );
};

export default Maintenance;

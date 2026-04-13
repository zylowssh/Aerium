import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Shield, 
  Activity, 
  Database, 
  Server, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  MoreHorizontal,
  UserPlus,
  Search,
  Filter
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { UserRoleModal } from '@/components/widgets/UserRoleModal';
import { InviteUserModal } from '@/components/widgets/InviteUserModal';
import { apiClient } from '@/lib/apiClient';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { useToast } from '@/hooks/use-toast';

type LogType = 'settings' | 'alert' | 'system' | 'report' | 'user';

interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at: string;
}

interface AdminAlert {
  id: string;
  sensorName?: string;
  message?: string;
  status?: string;
  timestamp?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

interface AdminMaintenance {
  id: string;
  sensorName?: string;
  type?: string;
  status?: string;
  scheduledDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AdminSensor {
  id: string;
  status?: string;
}

interface SystemHealthMetric {
  label: string;
  value: string;
  status: 'healthy' | 'warning';
  icon: typeof Server;
}

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  sortDate: string;
  type: LogType;
}

const toRelativeTime = (isoDate?: string): string => {
  if (!isoDate) return 'Inconnu';
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return 'Inconnu';

  const diffMs = Date.now() - then;
  const minutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;

  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
};

const normalizeAlertStatus = (status: string): 'nouvelle' | 'reconnue' | 'résolue' => {
  switch ((status || '').toLowerCase()) {
    case 'acknowledged':
    case 'reconnue':
      return 'reconnue';
    case 'resolved':
    case 'résolue':
    case 'resolue':
      return 'résolue';
    default:
      return 'nouvelle';
  }
};

const normalizeMaintenanceStatus = (status: string): 'scheduled' | 'in_progress' | 'completed' | 'overdue' => {
  switch ((status || '').toLowerCase()) {
    case 'en_cours':
    case 'in_progress':
      return 'in_progress';
    case 'terminé':
    case 'termine':
    case 'completed':
      return 'completed';
    case 'en_retard':
    case 'en retard':
    case 'overdue':
      return 'overdue';
    default:
      return 'scheduled';
  }
};

const maintenanceStatusLabel = (status: string): string => {
  switch (normalizeMaintenanceStatus(status)) {
    case 'in_progress':
      return 'Maintenance en cours';
    case 'completed':
      return 'Maintenance terminée';
    case 'overdue':
      return 'Maintenance en retard';
    default:
      return 'Maintenance planifiée';
  }
};

const getRoleBadge = (role: string) => {
  const styles = {
    admin: 'bg-primary/20 text-primary border-primary/30',
    manager: 'bg-warning/20 text-warning border-warning/30',
    viewer: 'bg-muted text-muted-foreground border-border',
  };
  return styles[role as keyof typeof styles] || styles.viewer;
};

const getActionIcon = (type: string) => {
  switch (type) {
    case 'settings': return <Shield className="w-4 h-4 text-primary" />;
    case 'alert': return <AlertTriangle className="w-4 h-4 text-warning" />;
    case 'system': return <Server className="w-4 h-4 text-muted-foreground" />;
    case 'report': return <Activity className="w-4 h-4 text-success" />;
    case 'user': return <Users className="w-4 h-4 text-primary" />;
    default: return <Activity className="w-4 h-4 text-muted-foreground" />;
  }
};

const Admin = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userRoleOpen, setUserRoleOpen] = useState(false);
  const [inviteUserOpen, setInviteUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<SystemHealthMetric[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [usersData, sensorsData, alertsData, maintenanceData, simulationResponse] = await Promise.all([
          apiClient.getAllUsers(),
          apiClient.getSensors(),
          apiClient.getAlerts(undefined, 250),
          apiClient.getMaintenance(undefined, undefined, 250),
          apiClient.get('/admin/simulation/speed').catch(() => null),
        ]);

        const normalizedUsers: AdminUser[] = (usersData || []).map((user: AdminUser) => ({
          id: String(user.id),
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          created_at: user.created_at,
        }));

        const normalizedSensors: AdminSensor[] = (sensorsData || []).map((sensor: AdminSensor) => ({
          id: String(sensor.id),
          status: sensor.status,
        }));

        const normalizedAlerts: AdminAlert[] = (alertsData || []).map((alert: AdminAlert) => ({
          id: String(alert.id),
          sensorName: alert.sensorName,
          message: alert.message,
          status: alert.status,
          timestamp: alert.timestamp,
          acknowledgedAt: alert.acknowledgedAt,
          resolvedAt: alert.resolvedAt,
        }));

        const normalizedMaintenance: AdminMaintenance[] = (maintenanceData || []).map((task: AdminMaintenance) => ({
          id: String(task.id),
          sensorName: task.sensorName,
          type: task.type,
          status: task.status,
          scheduledDate: task.scheduledDate,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        }));

        setUsers(normalizedUsers);

        const onlineSensors = normalizedSensors.filter((sensor) => sensor.status === 'en ligne').length;
        const totalSensors = normalizedSensors.length;
        const openAlerts = normalizedAlerts.filter((alert) => normalizeAlertStatus(alert.status || '') !== 'résolue').length;
        const overdueMaintenance = normalizedMaintenance.filter((task) => normalizeMaintenanceStatus(task.status || '') === 'overdue').length;
        const simulationSpeed = Number(simulationResponse?.data?.speed ?? 0);

        setHealthMetrics([
          {
            label: 'Vitesse Simulation',
            value: simulationSpeed > 0 ? `${simulationSpeed}s` : 'N/A',
            status: simulationSpeed > 0 && simulationSpeed <= 5 ? 'healthy' : 'warning',
            icon: Server,
          },
          {
            label: 'Capteurs en Ligne',
            value: `${onlineSensors}/${totalSensors}`,
            status: totalSensors === 0 || onlineSensors / Math.max(totalSensors, 1) >= 0.8 ? 'healthy' : 'warning',
            icon: Activity,
          },
          {
            label: 'Alertes Ouvertes',
            value: String(openAlerts),
            status: openAlerts === 0 ? 'healthy' : 'warning',
            icon: Database,
          },
          {
            label: 'Maintenance en Retard',
            value: String(overdueMaintenance),
            status: overdueMaintenance === 0 ? 'healthy' : 'warning',
            icon: Clock,
          },
        ]);

        const userActivity: ActivityLog[] = normalizedUsers
          .map((user) => ({
            id: `user-${user.id}`,
            user: user.full_name || user.email,
            action: 'Compte utilisateur actif',
            target: `Rôle: ${user.role}`,
            timestamp: toRelativeTime(user.created_at),
            sortDate: user.created_at,
            type: 'user',
          }));

        const alertActivity: ActivityLog[] = normalizedAlerts
          .map((alert) => {
            const normalizedStatus = normalizeAlertStatus(alert.status || '');
            const eventDate =
              normalizedStatus === 'résolue'
                ? alert.resolvedAt || alert.timestamp
                : normalizedStatus === 'reconnue'
                ? alert.acknowledgedAt || alert.timestamp
                : alert.timestamp;

            const action =
              normalizedStatus === 'résolue'
                ? 'Alerte résolue'
                : normalizedStatus === 'reconnue'
                ? 'Alerte reconnue'
                : 'Alerte détectée';

            return {
              id: `alert-${alert.id}`,
              user: 'Système',
              action,
              target: `${alert.sensorName || 'Capteur'} · ${(alert.message || 'Sans message').slice(0, 56)}`,
              timestamp: toRelativeTime(eventDate),
              sortDate: eventDate || new Date().toISOString(),
              type: 'alert' as const,
            };
          });

        const maintenanceActivity: ActivityLog[] = normalizedMaintenance
          .map((task) => ({
            id: `maintenance-${task.id}`,
            user: 'Maintenance',
            action: maintenanceStatusLabel(task.status || ''),
            target: `${task.sensorName || 'Capteur'} · ${task.type || 'Intervention'}`,
            timestamp: toRelativeTime(task.updatedAt || task.createdAt || task.scheduledDate),
            sortDate: task.updatedAt || task.createdAt || task.scheduledDate || new Date().toISOString(),
            type: 'settings' as const,
          }));

        const allActivity = [...alertActivity, ...maintenanceActivity, ...userActivity]
          .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
          .slice(0, 30);

        setActivityLogs(allActivity);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données administrateur',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setUserRoleOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Panneau d'Administration</h1>
            <p className="text-muted-foreground">Gérer les utilisateurs, surveiller la santé du système et consulter les journaux d'audit</p>
          </div>
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {healthMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        metric.status === 'healthy' ? 'bg-success/10' : 'bg-warning/10'
                      )}>
                        <metric.icon className={cn(
                          "w-5 h-5",
                          metric.status === 'healthy' ? 'text-success' : 'text-warning'
                        )} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{metric.label}</p>
                        <p className="text-lg font-semibold text-foreground">{metric.value}</p>
                      </div>
                    </div>
                    {metric.status === 'healthy' ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-warning" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <Clock className="w-4 h-4" />
              Journaux d'Audit
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <CardTitle className="text-lg">Gestion des Utilisateurs</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher des utilisateurs..."
                        className="pl-9 w-full sm:w-64 bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button className="gap-2" onClick={() => setInviteUserOpen(true)}>
                      <UserPlus className="w-4 h-4" />
                      <span className="hidden sm:inline">Ajouter un Utilisateur</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingSkeleton variant="table" count={5} />
                ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Créé le</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {user.full_name ? user.full_name.split(' ').map((n: string) => n[0]).join('') : user.email[0].toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{user.full_name || 'Anonymous'}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("capitalize", getRoleBadge(user.role))}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>Modifier l'Utilisateur</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>Changer le Rôle</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  Supprimer l'Utilisateur
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <CardTitle className="text-lg">Journaux d'Audit</CardTitle>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filtrer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingSkeleton variant="list" count={6} />
                ) : activityLogs.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Aucune activité récente trouvée.</div>
                ) : (
                  <div className="space-y-3">
                    {activityLogs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-background">
                          {getActionIcon(log.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground">{log.user}</span>
                            <span className="text-muted-foreground">{log.action}</span>
                            <span className="font-medium text-primary">{log.target}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{log.timestamp}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <UserRoleModal 
          open={userRoleOpen} 
          onOpenChange={setUserRoleOpen}
          user={selectedUser ? { id: selectedUser.id, name: selectedUser.full_name || selectedUser.email, email: selectedUser.email, role: selectedUser.role } : undefined}
        />
        <InviteUserModal open={inviteUserOpen} onOpenChange={setInviteUserOpen} />
      </div>
    </AppLayout>
  );
};

export default Admin;

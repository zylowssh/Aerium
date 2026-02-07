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
  XCircle, 
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

// Mock audit logs (would come from API in production)
const mockAuditLogs = [
  { id: '1', user: 'Sarah Chen', action: 'Seuil de capteur mis à jour', target: 'Salle de réunion A', timestamp: '2 mins ago', type: 'settings' },
  { id: '2', user: 'Marcus Johnson', action: 'Alerte reconnue', target: 'Avertissement CO₂ élevé', timestamp: '15 mins ago', type: 'alert' },
  { id: '3', user: 'System', action: 'Capteur hors ligne détecté', target: 'Capteur du hall', timestamp: '1 hour ago', type: 'system' },
  { id: '4', user: 'Emily Davis', action: 'Rapport exporté', target: 'Résumé hebdomadaire', timestamp: '2 hours ago', type: 'report' },
  { id: '5', user: 'Sarah Chen', action: 'Nouvel utilisateur ajouté', target: 'Jordan Lee', timestamp: '3 hours ago', type: 'user' },
  { id: '6', user: 'System', action: 'Sauvegarde de base de données terminée', target: 'Base de données de production', timestamp: '6 hours ago', type: 'system' },
];

const systemHealthMetrics = [
  { label: 'Temps de Fonctionnement de l\'API', value: '99.9%', status: 'healthy', icon: Server },
  { label: 'Base de Données', value: '45ms', status: 'healthy', icon: Database },
  { label: 'Connexions Actives', value: '127', status: 'healthy', icon: Activity },
  { label: 'Dernière Sauvegarde', value: '6h ago', status: 'warning', icon: Clock },
];

const getRoleBadge = (role: string) => {
  const styles = {
    admin: 'bg-primary/20 text-primary border-primary/30',
    manager: 'bg-warning/20 text-warning border-warning/30',
    viewer: 'bg-muted text-muted-foreground border-border',
  };
  return styles[role as keyof typeof styles] || styles.viewer;
};

const getStatusBadge = (status: string) => {
  if (status === 'active') {
    return 'bg-success/20 text-success border-success/30';
  }
  return 'bg-muted text-muted-foreground border-border';
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
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await apiClient.getAllUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les utilisateurs',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditUser = (user: any) => {
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
          {systemHealthMetrics.map((metric, index) => (
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
                <div className="space-y-3">
                  {mockAuditLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <UserRoleModal 
          open={userRoleOpen} 
          onOpenChange={setUserRoleOpen}
          user={selectedUser ? { id: selectedUser.id, name: selectedUser.name, email: selectedUser.email, role: selectedUser.role } : undefined}
        />
        <InviteUserModal open={inviteUserOpen} onOpenChange={setInviteUserOpen} />
      </div>
    </AppLayout>
  );
};

export default Admin;

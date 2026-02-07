import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, AlertCircle, CheckCircle2, Clock, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/apiClient';

interface Alert {
  id: string;
  sensorId: string;
  sensorName: string;
  sensorLocation: string;
  alertType: 'info' | 'avertissement' | 'critique';
  metric: string;
  metricValue: number;
  thresholdValue?: number;
  message: string;
  status: 'triggered' | 'acknowledged' | 'resolved';
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

const AlertHistory = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterDays, setFilterDays] = useState<number>(30);

  useEffect(() => {
    fetchAlerts();
  }, [filterStatus, filterType, filterDays]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getAlertHistory(filterDays);
      
      if (response && response.alerts) {
        // Filter by status and type if needed
        let filteredAlerts = response.alerts;
        
        if (filterStatus) {
          filteredAlerts = filteredAlerts.filter((a: any) => a.status === filterStatus);
        }
        if (filterType) {
          filteredAlerts = filteredAlerts.filter((a: any) => a.alertType === filterType);
        }
        
        setAlerts(filteredAlerts);
      } else {
        setError('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await apiClient.put(`/alerts/history/acknowledge/${alertId}`);
      fetchAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await apiClient.put(`/alerts/history/resolve/${alertId}`);
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getAlertIcon = (status: string) => {
    switch (status) {
      case 'triggered':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'acknowledged':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critique':
        return 'bg-red-500/10 border-red-500/30';
      case 'avertissement':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30';
      default:
        return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AppLayout title="Historique des Alertes" subtitle="Visualisez et gérez l'historique complet de vos alertes">
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600"
          >
            <p className="font-semibold">Erreur</p>
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-card border border-border rounded-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4" />
            <span className="font-semibold">Filtres</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Période
              </label>
              <Select value={filterDays.toString()} onValueChange={(v) => setFilterDays(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 derniers jours</SelectItem>
                  <SelectItem value="30">30 derniers jours</SelectItem>
                  <SelectItem value="90">90 derniers jours</SelectItem>
                  <SelectItem value="180">6 derniers mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Statut
              </label>
              <Select value={filterStatus || 'all'} onValueChange={(v) => setFilterStatus(v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="triggered">Déclenchée</SelectItem>
                  <SelectItem value="acknowledged">Accusée de réception</SelectItem>
                  <SelectItem value="resolved">Résolue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Type d'alerte
              </label>
              <Select value={filterType || 'all'} onValueChange={(v) => setFilterType(v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="critique">Critique</SelectItem>
                  <SelectItem value="avertissement">Avertissement</SelectItem>
                  <SelectItem value="info">Information</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Alerts List */}
        <div className="space-y-4">
          {loading ? (
            <LoadingSkeleton variant="alerts" count={5} />
          ) : alerts.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Aucune alerte trouvée pour les critères sélectionnés</p>
            </Card>
          ) : (
            alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`p-4 border ${getAlertColor(alert.alertType)}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className="mt-1">
                        {getAlertIcon(alert.status)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{alert.sensorName}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                            {alert.alertType}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary-foreground">
                            {alert.status}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Localisation:</span>
                            <p className="font-medium">{alert.sensorLocation}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Métrique:</span>
                            <p className="font-medium capitalize">{alert.metric}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Valeur:</span>
                            <p className="font-medium">{alert.metricValue.toFixed(1)}</p>
                          </div>
                          {alert.thresholdValue && (
                            <div>
                              <span className="text-muted-foreground">Seuil:</span>
                              <p className="font-medium">{alert.thresholdValue.toFixed(1)}</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground">
                          <p>Créée: {formatDate(alert.createdAt)}</p>
                          {alert.acknowledgedAt && (
                            <p>Accusée: {formatDate(alert.acknowledgedAt)}</p>
                          )}
                          {alert.resolvedAt && (
                            <p>Résolue: {formatDate(alert.resolvedAt)}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {alert.status === 'triggered' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcknowledge(alert.id)}
                          >
                            Reconnaître
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleResolve(alert.id)}
                          >
                            Résoudre
                          </Button>
                        </>
                      )}
                      {alert.status === 'acknowledged' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleResolve(alert.id)}
                        >
                          Résoudre
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AlertHistory;

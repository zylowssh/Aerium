import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, AlertCircle, CheckCircle2, Clock, Filter, RefreshCw, History } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { parseBackendDate } from '@/lib/dateTime';

interface ActiveAlert {
  id: string;
  sensorId: string;
  sensorName: string;
  type: 'info' | 'avertissement' | 'critique';
  message: string;
  value: number;
  status: 'nouvelle' | 'reconnue' | 'résolue';
  timestamp: string;
}

interface HistoryAlert {
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

interface AlertPayload {
  id?: string | number;
  sensorId?: string | number;
  sensor_id?: string | number;
  sensorName?: string;
  sensorLocation?: string;
  alertType?: string;
  alert_type?: string;
  type?: string;
  metric?: string;
  metricValue?: string | number;
  metric_value?: string | number;
  thresholdValue?: string | number | null;
  threshold_value?: string | number | null;
  value?: string | number;
  message?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
  timestamp?: string;
  acknowledgedAt?: string;
  acknowledged_at?: string;
  resolvedAt?: string;
  resolved_at?: string;
}

const normalizeActiveStatus = (status: string): ActiveAlert['status'] => {
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

const normalizeHistoryStatus = (status: string): HistoryAlert['status'] => {
  switch ((status || '').toLowerCase()) {
    case 'acknowledged':
    case 'reconnue':
      return 'acknowledged';
    case 'resolved':
    case 'résolue':
    case 'resolue':
      return 'resolved';
    default:
      return 'triggered';
  }
};

const normalizeType = (type: string): 'info' | 'avertissement' | 'critique' => {
  switch ((type || '').toLowerCase()) {
    case 'critique':
      return 'critique';
    case 'info':
      return 'info';
    default:
      return 'avertissement';
  }
};

const normalizeActiveAlert = (raw: AlertPayload): ActiveAlert => ({
  id: String(raw?.id ?? ''),
  sensorId: String(raw?.sensorId ?? raw?.sensor_id ?? ''),
  sensorName: raw?.sensorName || 'Capteur inconnu',
  type: normalizeType(raw?.type || raw?.alertType || raw?.alert_type),
  message: raw?.message || 'Alerte sans message',
  value: Number(raw?.value ?? raw?.metricValue ?? raw?.metric_value ?? 0),
  status: normalizeActiveStatus(raw?.status),
  timestamp: raw?.timestamp || raw?.createdAt || raw?.created_at || new Date().toISOString(),
});

const normalizeHistoryAlert = (raw: AlertPayload): HistoryAlert => ({
  id: String(raw?.id ?? ''),
  sensorId: String(raw?.sensorId ?? raw?.sensor_id ?? ''),
  sensorName: raw?.sensorName || 'Capteur inconnu',
  sensorLocation: raw?.sensorLocation || 'Inconnu',
  alertType: normalizeType(raw?.alertType || raw?.alert_type),
  metric: String(raw?.metric || ''),
  metricValue: Number(raw?.metricValue ?? raw?.metric_value ?? raw?.value ?? 0),
  thresholdValue:
    raw?.thresholdValue === null || raw?.thresholdValue === undefined
      ? raw?.threshold_value === null || raw?.threshold_value === undefined
        ? undefined
        : Number(raw?.threshold_value)
      : Number(raw?.thresholdValue),
  message: raw?.message || 'Alerte sans message',
  status: normalizeHistoryStatus(raw?.status),
  createdAt: raw?.createdAt || raw?.created_at || raw?.timestamp || new Date().toISOString(),
  acknowledgedAt: raw?.acknowledgedAt || raw?.acknowledged_at,
  resolvedAt: raw?.resolvedAt || raw?.resolved_at,
});

const AlertHistory = () => {
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [historyAlerts, setHistoryAlerts] = useState<HistoryAlert[]>([]);

  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentFilter, setCurrentFilter] = useState<'all' | 'nouvelle' | 'reconnue' | 'résolue'>('all');

  const [historyFilterDays, setHistoryFilterDays] = useState<number>(30);
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>('');
  const [historyFilterType, setHistoryFilterType] = useState<string>('');

  const fetchActiveAlerts = async () => {
    try {
      setLoadingActive(true);
      const response = await apiClient.getAlerts(undefined, 200);
      setActiveAlerts((response || []).map((item: AlertPayload) => normalizeActiveAlert(item)));
    } catch (err: any) {
      console.error('Error fetching active alerts:', err);
      setError(err?.response?.data?.error || 'Impossible de charger les alertes actives.');
    } finally {
      setLoadingActive(false);
    }
  };

  const fetchHistoryAlerts = async () => {
    try {
      setLoadingHistory(true);
      const response = await apiClient.getAlertHistory(historyFilterDays, 300);
      const normalized = Array.isArray(response?.alerts)
        ? response.alerts.map((item: AlertPayload) => normalizeHistoryAlert(item))
        : [];
      setHistoryAlerts(normalized);
    } catch (err: any) {
      console.error('Error fetching history alerts:', err);
      setError(err?.response?.data?.error || 'Impossible de charger l\'historique des alertes.');
      setHistoryAlerts([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const refreshAll = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await Promise.all([fetchActiveAlerts(), fetchHistoryAlerts()]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActiveAlerts();
  }, []);

  useEffect(() => {
    fetchHistoryAlerts();
  }, [historyFilterDays]);

  const filteredCurrentAlerts = useMemo(() => {
    if (currentFilter === 'all') return activeAlerts;
    return activeAlerts.filter((alert) => alert.status === currentFilter);
  }, [activeAlerts, currentFilter]);

  const filteredHistoryAlerts = useMemo(() => {
    let results = historyAlerts;
    if (historyFilterStatus) {
      results = results.filter((alert) => alert.status === historyFilterStatus);
    }
    if (historyFilterType) {
      results = results.filter((alert) => alert.alertType === historyFilterType);
    }
    return results;
  }, [historyAlerts, historyFilterStatus, historyFilterType]);

  const currentStats = useMemo(() => {
    const total = activeAlerts.length;
    const nouvelles = activeAlerts.filter((alert) => alert.status === 'nouvelle').length;
    const reconnues = activeAlerts.filter((alert) => alert.status === 'reconnue').length;
    const resolues = activeAlerts.filter((alert) => alert.status === 'résolue').length;
    return { total, nouvelles, reconnues, resolues };
  }, [activeAlerts]);

  const handleAcknowledgeCurrent = async (alertId: string) => {
    try {
      await apiClient.updateAlertStatus(alertId, 'reconnue');
      setActiveAlerts((prev) => prev.map((alert) => (
        alert.id === alertId ? { ...alert, status: 'reconnue' } : alert
      )));
    } catch (err) {
      console.error('Error acknowledging current alert:', err);
    }
  };

  const handleResolveCurrent = async (alertId: string) => {
    try {
      await apiClient.updateAlertStatus(alertId, 'résolue');
      setActiveAlerts((prev) => prev.map((alert) => (
        alert.id === alertId ? { ...alert, status: 'résolue' } : alert
      )));
    } catch (err) {
      console.error('Error resolving current alert:', err);
    }
  };

  const handleAcknowledgeHistory = async (alertId: string) => {
    try {
      await apiClient.put(`/alerts/history/acknowledge/${alertId}`);
      fetchHistoryAlerts();
    } catch (err) {
      console.error('Error acknowledging history alert:', err);
    }
  };

  const handleResolveHistory = async (alertId: string) => {
    try {
      await apiClient.put(`/alerts/history/resolve/${alertId}`);
      fetchHistoryAlerts();
    } catch (err) {
      console.error('Error resolving history alert:', err);
    }
  };

  const getCurrentAlertStyles = (type: ActiveAlert['type']) => {
    switch (type) {
      case 'critique':
        return { bg: 'bg-destructive/10', border: 'border-destructive/30', text: 'text-destructive' };
      case 'info':
        return { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary' };
      default:
        return { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning' };
    }
  };

  const getHistoryIcon = (status: HistoryAlert['status']) => {
    if (status === 'resolved') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === 'acknowledged') return <Clock className="w-5 h-5 text-yellow-500" />;
    return <AlertCircle className="w-5 h-5 text-red-500" />;
  };

  const formatDate = (date: string) => {
    return parseBackendDate(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AppLayout title="Centre des Alertes" subtitle="Alertes actuelles et historique consolidés au même endroit">
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <Button variant="outline" size="sm" className="gap-2" onClick={refreshAll} disabled={refreshing}>
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive"
          >
            <p className="font-semibold">Erreur</p>
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        <div className="widget-shell p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Alertes Actuelles</h3>
              <p className="text-xs text-muted-foreground">Gestion opérationnelle des alertes en cours.</p>
            </div>
            <div className="flex items-center gap-2">
              {(['all', 'nouvelle', 'reconnue', 'résolue'] as const).map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={currentFilter === filter ? 'default' : 'outline'}
                  onClick={() => setCurrentFilter(filter)}
                >
                  {filter === 'all' ? 'Toutes' : filter === 'nouvelle' ? 'Nouvelles' : filter === 'reconnue' ? 'Reconnues' : 'Résolues'}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: currentStats.total },
              { label: 'Nouvelles', value: currentStats.nouvelles, color: 'text-destructive' },
              { label: 'Reconnues', value: currentStats.reconnues, color: 'text-warning' },
              { label: 'Résolues', value: currentStats.resolues, color: 'text-green-600' },
            ].map((stat) => (
              <div key={stat.label} className="widget-shell-subtle p-3">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={cn('text-xl font-semibold', stat.color || 'text-foreground')}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {loadingActive ? (
              <LoadingSkeleton variant="alerts" count={3} />
            ) : filteredCurrentAlerts.length === 0 ? (
              <Card className="p-6 text-center">
                <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Aucune alerte active pour ce filtre.</p>
              </Card>
            ) : (
              filteredCurrentAlerts.map((alert, index) => {
                const styles = getCurrentAlertStyles(alert.type);
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn('widget-shell-subtle p-4 border', alert.status === 'nouvelle' ? styles.border : 'border-border')}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn('p-2.5 rounded-lg', styles.bg)}>
                        <Bell className={cn('w-5 h-5', styles.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="font-medium text-foreground">{alert.sensorName}</h4>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {alert.message}: <span className="font-medium text-foreground">{Number(alert.value ?? 0).toFixed(0)} ppm</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {alert.status === 'nouvelle' && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleAcknowledgeCurrent(alert.id)}>
                                  Reconnaître
                                </Button>
                                <Button size="sm" onClick={() => handleResolveCurrent(alert.id)}>
                                  Résoudre
                                </Button>
                              </>
                            )}
                            {alert.status === 'reconnue' && (
                              <Button size="sm" onClick={() => handleResolveCurrent(alert.id)}>
                                Résoudre
                              </Button>
                            )}
                            {alert.status === 'résolue' && (
                              <span className="text-sm text-green-600 font-medium">Résolue</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDistanceToNow(parseBackendDate(alert.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <div className="widget-shell p-4 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span className="font-semibold">Historique des alertes</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Période</label>
              <Select value={historyFilterDays.toString()} onValueChange={(v) => setHistoryFilterDays(parseInt(v, 10))}>
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
              <label className="text-sm text-muted-foreground mb-2 block">Statut</label>
              <Select value={historyFilterStatus || 'all'} onValueChange={(v) => setHistoryFilterStatus(v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="triggered">Déclenchée</SelectItem>
                  <SelectItem value="acknowledged">Accusée</SelectItem>
                  <SelectItem value="resolved">Résolue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Type</label>
              <Select value={historyFilterType || 'all'} onValueChange={(v) => setHistoryFilterType(v === 'all' ? '' : v)}>
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

          <div className="space-y-3">
            {loadingHistory ? (
              <LoadingSkeleton variant="alerts" count={4} />
            ) : filteredHistoryAlerts.length === 0 ? (
              <Card className="p-6 text-center">
                <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Aucune alerte historique pour ces critères.</p>
              </Card>
            ) : (
              filteredHistoryAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4 flex-1">
                        <div className="mt-1">{getHistoryIcon(alert.status)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-foreground">{alert.sensorName}</h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">{alert.alertType}</span>
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{alert.status}</span>
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
                              <p className="font-medium">{Number(alert.metricValue ?? 0).toFixed(1)}</p>
                            </div>
                            {alert.thresholdValue !== undefined && (
                              <div>
                                <span className="text-muted-foreground">Seuil:</span>
                                <p className="font-medium">{Number(alert.thresholdValue).toFixed(1)}</p>
                              </div>
                            )}
                          </div>

                          <div className="mt-2 text-xs text-muted-foreground">
                            <p>Créée: {formatDate(alert.createdAt)}</p>
                            {alert.acknowledgedAt && <p>Accusée: {formatDate(alert.acknowledgedAt)}</p>}
                            {alert.resolvedAt && <p>Résolue: {formatDate(alert.resolvedAt)}</p>}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {alert.status === 'triggered' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleAcknowledgeHistory(alert.id)}>
                              Reconnaître
                            </Button>
                            <Button size="sm" onClick={() => handleResolveHistory(alert.id)}>
                              Résoudre
                            </Button>
                          </>
                        )}
                        {alert.status === 'acknowledged' && (
                          <Button size="sm" onClick={() => handleResolveHistory(alert.id)}>
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
      </div>
    </AppLayout>
  );
};

export default AlertHistory;

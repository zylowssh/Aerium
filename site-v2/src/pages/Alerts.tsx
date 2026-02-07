import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, AlertTriangle, XCircle, Clock, Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/lib/sensorData';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { apiClient } from '@/lib/apiClient';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { useToast } from '@/hooks/use-toast';

interface Prediction {
  id: string;
  sensorName: string;
  metric: string;
  title: string;
  description: string;
  likelihood: number;
  timeframe: string;
  impact: 'low' | 'medium' | 'high';
  currentValue: number;
  trendPercentage: number;
}

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'nouvelle' | 'reconnue' | 'résolue'>('all');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [predictionsLoading, setPredictionsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch alerts
  useEffect(() => {
    fetchAlerts();
    fetchPredictions();
    const intervalId = window.setInterval(fetchPredictions, 5 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const fetchAlerts = async () => {
    try {
      const alertsData = await apiClient.getAlerts(undefined, 100);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les alertes',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      setPredictionsLoading(true);
      const predictionsData = await apiClient.getPredictions();
      setPredictions(predictionsData);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]);
    } finally {
      setPredictionsLoading(false);
    }
  };

  const getPredictionImpactColor = (impact: Prediction['impact']) => {
    switch (impact) {
      case 'low': return 'text-emerald-500';
      case 'medium': return 'text-amber-500';
      case 'high': return 'text-rose-500';
    }
  };

  const filteredAlerts = alerts.filter(alert => 
    filter === 'all' ? true : alert.status === filter
  );

  const acknowledgeAlert = async (id: string) => {
    try {
      await apiClient.updateAlertStatus(id, 'reconnue');
      setAlerts(prev => prev.map(a => 
        a.id === id ? { ...a, status: 'reconnue' as const } : a
      ));
      toast({
        title: 'Alerte reconnue',
        description: 'L\'alerte a été marquée comme reconnue'
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de reconnaître l\'alerte',
        variant: 'destructive'
      });
    }
  };

  const resolveAlert = async (id: string) => {
    try {
      await apiClient.updateAlertStatus(id, 'résolue');
      setAlerts(prev => prev.map(a => 
        a.id === id ? { ...a, status: 'résolue' as const } : a
      ));
      toast({
        title: 'Alerte résolue',
        description: 'L\'alerte a été marquée comme résolue'
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de résoudre l\'alerte',
        variant: 'destructive'
      });
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'avertissement': return AlertTriangle;
      case 'critique': return XCircle;
      case 'info': return Bell;
    }
  };

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'avertissement': return { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning' };
      case 'critique': return { bg: 'bg-destructive/10', border: 'border-destructive/30', text: 'text-destructive' };
      case 'info': return { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary' };
    }
  };

  return (
    <AppLayout title="Alertes" subtitle="Surveiller et gérer les alertes de qualité de l'air">
      <div className="space-y-6">
        {/* Filter Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(['all', 'nouvelle', 'reconnue', 'résolue'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className={filter === f ? 'gradient-primary text-primary-foreground' : ''}
              >
                {f === 'all' ? 'Toutes' :
                 f === 'nouvelle' ? 'Nouvelles' :
                 f === 'reconnue' ? 'Reconnues' :
                 'Résolues'}
                {f === 'nouvelle' && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-destructive/20 text-destructive rounded-full text-xs">
                    {alerts.filter(a => a.status === 'nouvelle').length}
                  </span>
                )}
              </Button>
            ))}
          </div>

          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Ajouter une Règle
          </Button>
        </div>

        {isLoading ? (
          <LoadingSkeleton variant="list" count={5} />
        ) : (
          <>
            {/* Predictive Alerts */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Alertes Prédictives</h3>
                  <p className="text-xs text-muted-foreground">Prévisions sur 24h basées sur les tendances</p>
                </div>
              </div>
              {predictionsLoading ? (
                <div className="text-xs text-muted-foreground">Chargement des prédictions...</div>
              ) : predictions.length === 0 ? (
                <div className="text-xs text-muted-foreground">Aucune alerte prédictive</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {predictions.slice(0, 6).map((prediction) => (
                    <div key={prediction.id} className="p-3 rounded-lg border border-border bg-muted/40">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-medium text-foreground truncate">{prediction.title}</h4>
                        <span className="text-[11px] text-muted-foreground">{prediction.timeframe}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{prediction.description}</p>
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        {prediction.sensorName} - {prediction.metric} ({prediction.currentValue}) {prediction.trendPercentage > 0 ? '↑' : '↓'} {Math.abs(prediction.trendPercentage)}%
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full',
                              prediction.impact === 'high'
                                ? 'bg-rose-500'
                                : prediction.impact === 'medium'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            )}
                            style={{ width: `${prediction.likelihood}%` }}
                          />
                        </div>
                        <span className={cn('text-xs font-medium', getPredictionImpactColor(prediction.impact))}>
                          {Math.round(prediction.likelihood)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total des Alertes', value: alerts.length, icon: Bell },
                { label: 'Nouvelles', value: alerts.filter(a => a.status === 'nouvelle').length, color: 'text-destructive' },
                { label: 'Reconnues', value: alerts.filter(a => a.status === 'reconnue').length, color: 'text-warning' },
                { label: 'Résolues', value: alerts.filter(a => a.status === 'résolue').length, color: 'text-success' }
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

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.map((alert, index) => {
            const Icon = getAlertIcon(alert.type);
            const styles = getAlertStyles(alert.type);

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className={cn(
                  "p-4 rounded-xl border bg-card",
                  alert.status === 'nouvelle' ? styles.border : 'border-border'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("p-2.5 rounded-lg", styles.bg)}>
                    <Icon className={cn("w-5 h-5", styles.text)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-medium text-foreground">{alert.sensorName}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {alert.message}: <span className="font-medium text-foreground">{alert.value}ppm</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {alert.status === 'nouvelle' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>
                              Reconnaître
                            </Button>
                            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => resolveAlert(alert.id)}>
                              Résoudre
                            </Button>
                          </>
                        )}
                        {alert.status === 'reconnue' && (
                          <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => resolveAlert(alert.id)}>
                            Résoudre
                          </Button>
                        )}
                        {alert.status === 'résolue' && (
                          <span className="flex items-center gap-1.5 text-sm text-success">
                            <CheckCircle className="w-4 h-4" />
                            Résolue
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full border",
                        alert.status === 'nouvelle' ? 'bg-destructive/10 border-destructive/30 text-destructive' :
                        alert.status === 'reconnue' ? 'bg-warning/10 border-warning/30 text-warning' :
                        'bg-success/10 border-success/30 text-success'
                      )}>
                        {alert.status === 'nouvelle' ? 'Nouvelle' :
                        alert.status === 'reconnue' ? 'Reconnue' :
                        'Résolue'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Alerts;

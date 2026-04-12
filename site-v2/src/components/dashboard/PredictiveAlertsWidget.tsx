import { motion } from 'framer-motion';
import { Brain, TrendingUp, Zap, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';

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

export function PredictiveAlertsWidget() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
    const intervalId = window.setInterval(fetchPredictions, 5 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const predictionsData = await apiClient.getPredictions();
      setPredictions(predictionsData.slice(0, 3));
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: Prediction['impact']) => {
    switch (impact) {
      case 'low': return 'text-emerald-500';
      case 'medium': return 'text-amber-500';
      case 'high': return 'text-rose-500';
    }
  };

  const getProgressColor = (impact: Prediction['impact']) => {
    switch (impact) {
      case 'low': return 'bg-emerald-500';
      case 'medium': return 'bg-amber-500';
      case 'high': return 'bg-rose-500';
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
        <Brain className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Alertes Prédictives</h3>
        <span className="ml-auto px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium">
          IA
        </span>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-xs text-muted-foreground">Chargement...</div>
        ) : predictions.length === 0 ? (
          <div className="text-xs text-muted-foreground">Aucune alerte prédictive</div>
        ) : (
          predictions.map((prediction, index) => (
            <motion.div
              key={prediction.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className={cn('h-3.5 w-3.5', getImpactColor(prediction.impact))} />
                  <h4 className="text-xs font-medium text-foreground truncate">{prediction.title}</h4>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{prediction.timeframe}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{prediction.description}</p>
              <div className="text-xs text-muted-foreground mb-2">
                {prediction.sensorName} - {prediction.metric} ({prediction.currentValue}) {prediction.trendPercentage > 0 ? '↑' : '↓'} {Math.abs(prediction.trendPercentage)}%
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${prediction.likelihood}%` }}
                    transition={{ duration: 0.8, delay: index * 0.15 }}
                    className={cn('h-full rounded-full', getProgressColor(prediction.impact))}
                  />
                </div>
                <span className={cn('text-xs font-medium', getImpactColor(prediction.impact))}>
                  {Math.round(prediction.likelihood)}%
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="h-3 w-3" />
        <span>Prédictions en temps réel basées sur tendances</span>
      </div>
    </motion.div>
  );
}

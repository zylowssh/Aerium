import { motion } from 'framer-motion';
import { Brain, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Skeleton } from '@/components/ui/skeleton';

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

interface PredictionsCacheEntry {
  fetchedAt: number;
  predictions: Prediction[];
}

const PREDICTIONS_CACHE_KEY = 'aerium_predictive_alerts_cache_v1';
const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

const compactText = (value: string, maxLen: number) => {
  const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLen) return normalized;
  if (maxLen <= 3) return normalized.slice(0, maxLen);
  return `${normalized.slice(0, maxLen - 3).trim()}...`;
};

export function PredictiveAlertsWidget() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const readCache = (): PredictionsCacheEntry | null => {
    try {
      const raw = localStorage.getItem(PREDICTIONS_CACHE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as PredictionsCacheEntry;
      if (!parsed || !Array.isArray(parsed.predictions) || typeof parsed.fetchedAt !== 'number') {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const writeCache = (nextPredictions: Prediction[]) => {
    const payload: PredictionsCacheEntry = {
      fetchedAt: Date.now(),
      predictions: nextPredictions,
    };
    localStorage.setItem(PREDICTIONS_CACHE_KEY, JSON.stringify(payload));
  };

  useEffect(() => {
    const cache = readCache();
    const isFresh = !!cache && Date.now() - cache.fetchedAt < REFRESH_INTERVAL_MS;

    if (cache) {
      setPredictions(cache.predictions.slice(0, 3));
      setLoading(false);
    }

    if (!isFresh) {
      fetchPredictions();
    }

    const intervalId = window.setInterval(fetchPredictions, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const predictionsData = await apiClient.getPredictions();
      const topPredictions = predictionsData.slice(0, 3);
      setPredictions(topPredictions);
      writeCache(topPredictions);
    } catch (error) {
      console.error('Error fetching predictions:', error);

      const cache = readCache();
      if (cache) {
        setPredictions(cache.predictions.slice(0, 3));
      } else {
        setPredictions([]);
      }
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
        'relative overflow-hidden rounded-2xl border border-border/80 p-4 md:p-5',
        'bg-card/70 backdrop-blur-sm supports-[backdrop-filter]:bg-card/55'
      )}
    >
      <div className="pointer-events-none absolute -left-20 -top-20 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            Analyse IA
          </div>
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Alertes Prédictives</h3>
          </div>
        </div>
        <span className="rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
          IA
        </span>
      </div>

      <div className="relative space-y-2.5">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-border/70 bg-background/55 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-14" />
              </div>
              <Skeleton className="mb-2 h-3 w-full" />
              <Skeleton className="mb-3 h-3 w-3/4" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))
        ) : predictions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/70 bg-background/45 p-3 text-xs text-muted-foreground">
            Aucune alerte prédictive
          </div>
        ) : (
          predictions.map((prediction, index) => (
            <motion.div
              key={prediction.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-lg border border-border/70 bg-background/55 p-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className={cn('h-3.5 w-3.5', getImpactColor(prediction.impact))} />
                  <h4 className="text-xs font-medium text-foreground truncate">{compactText(prediction.title, 55)}</h4>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{compactText(prediction.timeframe, 30)}</span>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">{compactText(prediction.description, 115)}</p>
              <div className="mb-2 text-xs text-muted-foreground">
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

      <div className="mt-3 flex items-center gap-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <Info className="h-3 w-3" />
        <span>Prédictions IA mises à jour environ chaque heure</span>
      </div>
    </motion.div>
  );
}

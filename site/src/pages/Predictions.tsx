import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  MessageCircle,
  Wifi,
  WifiOff,
  TrendingUp,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/apiClient';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Line,
  ReferenceLine,
} from 'recharts';

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

interface AIForecastPoint {
  hour: string;
  co2: number;
  co2_lower?: number;
  co2_upper?: number;
  temperature?: number;
  humidity?: number;
}

interface PredictionTrends {
  risk_level?: string;
  peak_co2?: number;
  peak_hour?: string;
  co2_direction?: string;
  co2_change_pct?: number;
}

interface AIRecommendation {
  title: string;
  description: string;
  impact: 'élevé' | 'moyen' | 'faible' | string;
  category: string;
  action: string;
  savings: string;
}

interface AIRecommendationsResponse {
  recommendations: AIRecommendation[];
  health_score: number;
  summary: string;
  generated_at: string;
  fallback?: boolean;
}

const CHAT_PROMPTS = [
  'Quels capteurs sont les plus a risque ?',
  'Comment réduire mon pic CO2 de demain ?',
  'Quelles actions faire dans les 2 prochaines heures ?',
  'Explique la tendance de risque actuelle.',
];

const IMPACT_STYLES: Record<string, string> = {
  élevé: 'bg-destructive/10 text-destructive border-destructive/30',
  moyen: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  faible: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30',
};

const Alerts = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [predictionForecast, setPredictionForecast] = useState<AIForecastPoint[]>([]);
  const [predictionTrends, setPredictionTrends] = useState<PredictionTrends | null>(null);
  const [predictionsLoading, setPredictionsLoading] = useState(true);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [recommendationsData, setRecommendationsData] = useState<AIRecommendationsResponse | null>(null);

  const [chatConfigured, setChatConfigured] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPredictions = async () => {
    try {
      setPredictionsLoading(true);
      setPredictionError(null);
      const predictiveData = await apiClient.getPredictiveAlertsData();
      setPredictions(predictiveData.cards);
      setPredictionForecast(predictiveData.forecast);
      setPredictionTrends(predictiveData.trends);
    } catch (error: any) {
      console.error('Error fetching predictions:', error);
      setPredictionError(error?.response?.data?.error || 'Impossible de charger les prédictions IA.');
      setPredictions([]);
      setPredictionForecast([]);
      setPredictionTrends(null);
    } finally {
      setPredictionsLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setRecommendationsLoading(true);
      setRecommendationsError(null);
      const data = await apiClient.getAIRecommendations();
      setRecommendationsData(data);
    } catch (error: any) {
      console.error('Error fetching AI recommendations:', error);
      setRecommendationsError(error?.response?.data?.error || 'Impossible de charger les recommandations IA.');
      setRecommendationsData(null);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const fetchChatStatus = async () => {
    try {
      const response = await apiClient.get('/ai/status');
      setChatConfigured(Boolean(response?.data?.configured));
    } catch (error) {
      console.error('Error fetching AI status:', error);
      setChatConfigured(false);
    }
  };

  const refreshAll = async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchPredictions(), fetchRecommendations(), fetchChatStatus()]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshAll();
    const intervalId = window.setInterval(fetchPredictions, 5 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const getPredictionImpactColor = (impact: Prediction['impact']) => {
    switch (impact) {
      case 'low':
        return 'text-emerald-500';
      case 'medium':
        return 'text-amber-500';
      default:
        return 'text-rose-500';
    }
  };

  const getRiskBadgeClass = (risk?: string) => {
    if (risk === 'high') return 'bg-rose-500/10 text-rose-600 border-rose-500/30';
    if (risk === 'moderate') return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
    return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
  };

  const getRiskLabel = (risk?: string) => {
    if (risk === 'high') return 'Risque eleve';
    if (risk === 'moderate') return 'Risque modere';
    return 'Risque faible';
  };

  const trendLabel =
    predictionTrends?.co2_direction === 'rising'
      ? 'CO2 en hausse'
      : predictionTrends?.co2_direction === 'falling'
      ? 'CO2 en baisse'
      : 'CO2 stable';

  return (
    <AppLayout title="Prévisions IA" subtitle="Anticipez les risques avec les prédictions et recommandations d'Aéria">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Centre de prédiction</h2>
            <p className="text-sm text-muted-foreground">Prévisions 24h, risques IA et recommandations d'action.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={refreshAll} disabled={refreshing}>
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </div>

        <div className="widget-shell p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Prédictions IA 24h</h3>
              <p className="text-xs text-muted-foreground">Prévisions calculées à partir des tendances récentes.</p>
            </div>
            {predictionTrends?.risk_level && (
              <span className={cn('px-2 py-0.5 rounded-full border text-xs font-medium', getRiskBadgeClass(predictionTrends.risk_level))}>
                {getRiskLabel(predictionTrends.risk_level)}
              </span>
            )}
          </div>

          {predictionsLoading ? (
            <LoadingSkeleton variant="trend-chart" />
          ) : predictionError ? (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4" />
              {predictionError}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {trendLabel}
                </span>
                {predictionTrends?.co2_change_pct !== undefined && (
                  <span>
                    Variation: {predictionTrends.co2_change_pct > 0 ? '+' : ''}{Math.round(predictionTrends.co2_change_pct)}%
                  </span>
                )}
                {predictionTrends?.peak_co2 !== undefined && (
                  <span>
                    Pic: {Math.round(predictionTrends.peak_co2)} ppm
                    {predictionTrends.peak_hour ? ` vers ${predictionTrends.peak_hour}` : ''}
                  </span>
                )}
              </div>

              {predictionForecast.length > 0 && (
                <div className="widget-shell-subtle p-3">
                  <p className="text-xs font-medium text-foreground mb-2">Tendance CO2 prévue (24h)</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={predictionForecast} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="hour"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        interval={2}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: any, name: string) => [
                          `${Math.round(Number(value))} ppm`,
                          name === 'co2' ? 'CO2 prevu' : name === 'co2_upper' ? 'Borne haute' : 'Borne basse',
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="co2_upper"
                        stroke="none"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.08}
                        legendType="none"
                      />
                      <Area
                        type="monotone"
                        dataKey="co2_lower"
                        stroke="none"
                        fill="hsl(var(--background))"
                        fillOpacity={1}
                        legendType="none"
                      />
                      <Line
                        type="monotone"
                        dataKey="co2"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="5 3"
                      />
                      <ReferenceLine y={800} stroke="hsl(var(--warning))" strokeDasharray="4 3" strokeWidth={1} />
                      <ReferenceLine y={1000} stroke="hsl(var(--destructive))" strokeDasharray="4 3" strokeWidth={1} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {predictions.slice(0, 6).map((prediction) => (
                  <div key={prediction.id} className="widget-shell-subtle p-3">
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
                          className={cn(
                            'h-full rounded-full',
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
            </div>
          )}
        </div>

        <div className="widget-shell p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Recommandations IA</h3>
              {recommendationsData?.fallback && (
                <Badge variant="outline" className="text-xs font-normal text-muted-foreground">Fallback</Badge>
              )}
            </div>
            {recommendationsData?.health_score !== undefined && (
              <span className="text-xs text-muted-foreground">Score santé: {recommendationsData.health_score}/100</span>
            )}
          </div>

          {recommendationsLoading ? (
            <LoadingSkeleton variant="card" count={1} />
          ) : recommendationsError ? (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4" />
              {recommendationsError}
            </div>
          ) : recommendationsData ? (
            <div className="space-y-3">
              {recommendationsData.summary && (
                <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/15">
                  <MarkdownRenderer content={recommendationsData.summary} />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendationsData.recommendations.slice(0, 4).map((item, index) => (
                  <motion.div
                    key={`${item.title}-${index}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="widget-shell-subtle p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
                      <Badge variant="outline" className={cn('text-[10px]', IMPACT_STYLES[item.impact] ?? '')}>
                        {item.impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                    <p className="text-xs text-foreground/80">Action: {item.action}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune recommandation disponible.</p>
          )}
        </div>

        <div className="widget-shell p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Chat IA Aéria</h3>
            {chatConfigured === false ? (
              <span className="ml-auto flex items-center gap-1 text-xs text-destructive"><WifiOff className="w-3 h-3" /> Non configuré</span>
            ) : (
              <span className="ml-auto flex items-center gap-1 text-xs text-green-600"><Wifi className="w-3 h-3" /> Disponible</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Le chat est accessible en bas à droite sur cette page. Utilisez-le pour explorer les causes, risques et actions.
          </p>
          <div className="flex flex-wrap gap-2">
            {CHAT_PROMPTS.map((prompt) => (
              <span key={prompt} className="px-2 py-1 rounded-full text-xs bg-muted border border-border text-muted-foreground">
                {prompt}
              </span>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Alerts;

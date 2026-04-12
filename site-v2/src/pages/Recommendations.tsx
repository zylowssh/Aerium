import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Target, Award, Calendar, ArrowRight, Lightbulb,
  Leaf, Users, Clock, CheckCircle2, Thermometer, Droplets,
  Wind, Wrench, RefreshCw, Sparkles, TrendingUp, AlertTriangle,
  ShieldCheck, Bot,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { apiClient } from '@/lib/apiClient';
import MarkdownRenderer from '@/components/MarkdownRenderer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AIRecommendation {
  title: string;
  description: string;
  impact: 'élevé' | 'moyen' | 'faible';
  category: 'ventilation' | 'temperature' | 'humidite' | 'maintenance' | 'organisation' | string;
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

interface Goal {
  label: string;
  current: number;
  target: number;
  unit: string;
  status: 'good' | 'warning' | 'danger';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  ventilation:  Wind,
  temperature:  Thermometer,
  humidite:     Droplets,
  maintenance:  Wrench,
  organisation: Users,
  default:      Lightbulb,
};

const IMPACT_STYLES: Record<string, string> = {
  'élevé': 'bg-destructive/10 text-destructive border-destructive/30',
  'moyen': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  'faible': 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30',
};

const HEALTH_COLOR = (score: number) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-destructive';
};

const HEALTH_LABEL = (score: number) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Acceptable';
  if (score >= 40) return 'À améliorer';
  return 'Critique';
};

const achievements = [
  { id: 1, title: 'Première Semaine Sans Alerte', icon: Award,     unlocked: true,  date: '15 Jan 2026' },
  { id: 2, title: 'Score Santé Excellence',        icon: Target,    unlocked: true,  date: '20 Jan 2026' },
  { id: 3, title: '30 Jours Consécutifs',          icon: Calendar,  unlocked: false, progress: 22 },
  { id: 4, title: 'Zéro Émission Critique',        icon: Leaf,      unlocked: false, progress: 85 },
];

// ---------------------------------------------------------------------------
// AI Loading skeleton
// ---------------------------------------------------------------------------

function AILoadingState() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-8 flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="w-7 h-7 text-primary" />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary animate-ping opacity-50" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">Aéria analyse vos données…</p>
          <p className="text-xs text-muted-foreground">Génération des recommandations personnalisées</p>
        </div>
        <div className="w-full space-y-2 max-w-sm">
          {[80, 60, 70].map((w, i) => (
            <div key={i} className="h-3 rounded-full bg-muted animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const Recommendations = () => {
  const [loading,   setLoading]   = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [goals,     setGoals]     = useState<Goal[]>([]);
  const [aiData,    setAiData]    = useState<AIRecommendationsResponse | null>(null);
  const [aiError,   setAiError]   = useState<string | null>(null);

  // ---- Fetch goals from aggregate data ----
  const fetchGoals = useCallback(async () => {
    try {
      const readings = await apiClient.getAggregateData();
      const avgCo2  = readings.avgCo2  || 700;
      const avgTemp = readings.avgTemperature || 22;
      const avgHum  = readings.avgHumidity   || 50;

      const co2Score  = Math.max(0, Math.min(100, Math.round(100 - (avgCo2  - 400) / 5.5)));
      const tempScore = Math.max(0, Math.min(100, Math.round(100 - Math.abs(avgTemp - 22) * 12)));
      const humScore  = Math.max(0, Math.min(100, Math.round(100 - Math.abs(avgHum  - 50) * 2)));

      setGoals([
        {
          label: 'CO₂ < 800 ppm',
          current: co2Score,
          target: 90,
          unit: '%',
          status: co2Score >= 80 ? 'good' : co2Score >= 50 ? 'warning' : 'danger',
        },
        {
          label: 'Température 20–24°C',
          current: tempScore,
          target: 95,
          unit: '%',
          status: tempScore >= 80 ? 'good' : tempScore >= 50 ? 'warning' : 'danger',
        },
        {
          label: 'Humidité 40–60%',
          current: humScore,
          target: 80,
          unit: '%',
          status: humScore >= 70 ? 'good' : humScore >= 40 ? 'warning' : 'danger',
        },
        {
          label: 'Score santé global',
          current: Math.round((co2Score + tempScore + humScore) / 3),
          target: 90,
          unit: '/100',
          status:
            (co2Score + tempScore + humScore) / 3 >= 75
              ? 'good'
              : (co2Score + tempScore + humScore) / 3 >= 50
              ? 'warning'
              : 'danger',
        },
      ]);
    } catch (e) {
      console.error('Error fetching goals:', e);
    }
  }, []);

  // ---- Fetch AI recommendations ----
  const fetchAIRecommendations = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const data = await apiClient.getAIRecommendations();
      setAiData(data);
    } catch (e: any) {
      setAiError(
        e?.response?.data?.error || 'Impossible de générer les recommandations IA.'
      );
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchGoals(), fetchAIRecommendations()]);
      setLoading(false);
    })();
  }, [fetchGoals, fetchAIRecommendations]);

  const goalStatusColor = (s: Goal['status']) => {
    if (s === 'good')    return 'text-green-500';
    if (s === 'warning') return 'text-yellow-500';
    return 'text-destructive';
  };

  const goalBarColor = (s: Goal['status']) => {
    if (s === 'good')    return '[&>div]:bg-green-500';
    if (s === 'warning') return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-destructive';
  };

  return (
    <AppLayout
      title="Recommandations"
      subtitle="Recommandations personnalisées par IA basées sur vos données en temps réel"
    >
      <div className="space-y-6">
        {loading ? (
          <>
            <LoadingSkeleton variant="kpi" count={4} />
            <LoadingSkeleton variant="card" count={2} />
          </>
        ) : (
          <>
            {/* ---- Goals KPI row ---- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Card className="bg-card border-border h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground font-medium">{goal.label}</span>
                        <Target className={cn('w-4 h-4', goalStatusColor(goal.status))} />
                      </div>
                      <div className="flex items-end gap-1.5 mb-2">
                        <span className={cn('text-2xl font-bold', goalStatusColor(goal.status))}>
                          {goal.current}
                        </span>
                        <span className="text-sm text-muted-foreground mb-0.5">
                          / {goal.target}{goal.unit}
                        </span>
                      </div>
                      <Progress
                        value={(goal.current / goal.target) * 100}
                        className={cn('h-1.5', goalBarColor(goal.status))}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* ---- AI Recommendations card ---- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {aiLoading ? (
                <AILoadingState />
              ) : aiError ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
                    <AlertTriangle className="w-10 h-10 text-destructive/60" />
                    <div>
                      <p className="font-medium text-foreground mb-1">Recommandations IA indisponibles</p>
                      <p className="text-sm text-muted-foreground">{aiError}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchAIRecommendations}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Réessayer
                    </Button>
                  </CardContent>
                </Card>
              ) : aiData ? (
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Recommandations IA
                        {aiData.fallback && (
                          <Badge variant="outline" className="text-xs font-normal text-muted-foreground ml-1">
                            Fallback
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        {/* Health score badge */}
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className={cn('w-4 h-4', HEALTH_COLOR(aiData.health_score))} />
                          <span className={cn('text-sm font-semibold', HEALTH_COLOR(aiData.health_score))}>
                            {aiData.health_score}/100
                          </span>
                          <span className="text-xs text-muted-foreground">
                            — {HEALTH_LABEL(aiData.health_score)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                          onClick={fetchAIRecommendations}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Actualiser
                        </Button>
                      </div>
                    </div>
                    {/* AI Summary */}
                    {aiData.summary && (
                      <div className="mt-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                        <MarkdownRenderer content={aiData.summary} />
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <AnimatePresence mode="wait">
                      {aiData.recommendations.map((rec, index) => {
                        const Icon = CATEGORY_ICONS[rec.category] ?? CATEGORY_ICONS.default;
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.07 }}
                            className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors group"
                          >
                            {/* Category icon */}
                            <div className="p-2.5 rounded-xl bg-primary/10 flex-shrink-0 mt-0.5">
                              <Icon className="w-4 h-4 text-primary" />
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Title + badge */}
                              <div className="flex items-start gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-foreground text-sm">{rec.title}</h4>
                                <Badge
                                  variant="outline"
                                  className={cn('text-xs shrink-0', IMPACT_STYLES[rec.impact] ?? '')}
                                >
                                  Impact {rec.impact}
                                </Badge>
                              </div>

                              {/* Description */}
                              <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                                {rec.description}
                              </p>

                              {/* Action */}
                              {rec.action && (
                                <div className="flex items-start gap-1.5 mb-1.5">
                                  <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-foreground/80 font-medium">{rec.action}</p>
                                </div>
                              )}

                              {/* Savings */}
                              {rec.savings && (
                                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  {rec.savings}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Generated at */}
                    <p className="text-xs text-muted-foreground text-right pt-1">
                      Généré par Aéria · {new Date(aiData.generated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </CardContent>
                </Card>
              ) : null}
            </motion.div>

            {/* ---- Achievements ---- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Succès et Objectifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {achievements.map((a) => (
                      <div
                        key={a.id}
                        className={cn(
                          'p-4 rounded-xl border text-center transition-all',
                          a.unlocked
                            ? 'bg-primary/5 border-primary/20'
                            : 'bg-muted/30 border-border opacity-60'
                        )}
                      >
                        <div
                          className={cn(
                            'w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center',
                            a.unlocked ? 'bg-primary/20' : 'bg-muted'
                          )}
                        >
                          {a.unlocked
                            ? <CheckCircle2 className="w-6 h-6 text-primary" />
                            : <a.icon className="w-6 h-6 text-muted-foreground" />}
                        </div>
                        <h4 className="font-medium text-foreground text-sm mb-1">{a.title}</h4>
                        {a.unlocked ? (
                          <p className="text-xs text-green-500">{a.date}</p>
                        ) : (
                          <div className="mt-2">
                            <Progress value={a.progress} className="h-1" />
                            <p className="text-xs text-muted-foreground mt-1">{a.progress}%</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Recommendations;

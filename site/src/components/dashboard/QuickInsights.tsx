import { Radio, Activity, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface QuickInsightsProps {
  sensorsOnline: number;
  totalSensors: number;
  readingsToday: number;
  peakCO2: number;
  bestAirTime: string;
  isLoading?: boolean;
}

export const QuickInsights = memo(function QuickInsights({
  sensorsOnline,
  totalSensors,
  readingsToday,
  peakCO2,
  bestAirTime,
  isLoading = false,
}: QuickInsightsProps) {
  const insights = [
    {
      label: 'Capteurs En Ligne',
      value: `${sensorsOnline}/${totalSensors}`,
      icon: Radio,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      label: 'Lectures Aujourd\'hui',
      value: readingsToday.toString(),
      icon: Activity,
      color: 'text-muted-foreground',
      bg: 'bg-muted'
    },
    {
      label: 'Pic CO₂ Aujourd\'hui',
      value: `${peakCO2.toLocaleString()} ppm`,
      icon: TrendingUp,
      color: 'text-warning',
      bg: 'bg-warning/10'
    },
    {
      label: 'Meilleur Moment d\'Air',
      value: bestAirTime,
      icon: Clock,
      color: 'text-success',
      bg: 'bg-success/10'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border/80 p-4 md:p-5 bg-card/70 backdrop-blur-sm supports-[backdrop-filter]:bg-card/55"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mb-5">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          Synthèse instantanée
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Aperçus Rapides</h3>
        </div>
      </div>
      
      <div className="relative space-y-2.5">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`quick-insight-skeleton-${index}`}
                className="flex items-center justify-between rounded-lg border border-border/70 bg-background/55 p-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))
          : insights.map((insight, index) => (
              <motion.div 
                key={index} 
                className="flex items-center justify-between rounded-lg border border-border/70 bg-background/55 p-3 transition-colors hover:border-primary/30"
                whileHover={{ y: -1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("rounded-lg border border-border/50 p-2", insight.bg)}>
                    <insight.icon className={cn("w-4 h-4", insight.color)} />
                  </div>
                  <span className="text-sm text-muted-foreground">{insight.label}</span>
                </div>
                <span className={cn("text-sm font-semibold tabular-nums", insight.color)}>
                  {insight.value}
                </span>
              </motion.div>
            ))}
      </div>
    </motion.div>
  );
});

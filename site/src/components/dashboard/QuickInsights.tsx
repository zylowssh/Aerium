import { Radio, Activity, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { memo } from 'react';

interface QuickInsightsProps {
  sensorsOnline: number;
  totalSensors: number;
  readingsToday: number;
  peakCO2: number;
  bestAirTime: string;
}

export const QuickInsights = memo(function QuickInsights({
  sensorsOnline,
  totalSensors,
  readingsToday,
  peakCO2,
  bestAirTime
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
      className="p-5 rounded-xl bg-card/50 backdrop-blur-sm border border-border"
    >
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Aperçus Rapides</h3>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <motion.div 
            key={index} 
            className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/20 transition-colors"
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", insight.bg)}>
                <insight.icon className={cn("w-4 h-4", insight.color)} />
              </div>
              <span className="text-sm text-muted-foreground">{insight.label}</span>
            </div>
            <span className={cn("text-sm font-bold tabular-nums", insight.color)}>
              {insight.value}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});

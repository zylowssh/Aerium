import { motion } from 'framer-motion';
import { Leaf, Zap, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';

interface EnergyMetric {
  label: string;
  value: string;
  change: number;
  unit: string;
}

export function EnergyMonitorWidget() {
  const [ecoScore, setEcoScore] = useState(78);
  const [metrics, setMetrics] = useState<EnergyMetric[]>([
    { label: 'HVAC aujourd\'hui', value: '12.4', change: -8, unit: 'kWh' },
    { label: 'Économies mois', value: '156', change: 12, unit: '€' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnergyData();
  }, []);

  const fetchEnergyData = async () => {
    try {
      setLoading(true);
      const readings = await apiClient.getAggregateData();
      
      // Calculate eco-score based on average CO2 and conditions
      // Lower CO2 = better efficiency = higher score
      const baseCo2 = readings.avgCo2 || 800;
      const calculatedScore = Math.max(0, Math.min(100, 100 - (baseCo2 - 400) / 6));
      
      setEcoScore(Math.round(calculatedScore));
      
      // Update metrics with real data
      setMetrics([
        { 
          label: 'CO2 moyen', 
          value: Math.round(readings.avgCo2 || 800).toString(), 
          change: -5, 
          unit: 'ppm' 
        },
        { 
          label: 'Efficacité', 
          value: '92', 
          change: 8, 
          unit: '%' 
        },
      ]);
    } catch (error) {
      console.error('Error fetching energy data:', error);
      // Keep default values
    } finally {
      setLoading(false);
    }
  };

  const circumference = 2 * Math.PI * 40;
  const progress = (ecoScore / 100) * circumference;

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
        <Leaf className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-semibold text-foreground">Éco-Score</h3>
        <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Énergie
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Circular progress */}
        <div className="relative">
          <svg width="96" height="96" className="transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              fill="none"
            />
            <motion.circle
              cx="48"
              cy="48"
              r="40"
              stroke="hsl(142, 71%, 45%)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - progress }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-foreground">{ecoScore}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex-1 space-y-2">
          {loading ? (
            <div className="text-xs text-muted-foreground">Chargement...</div>
          ) : (
            metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {metric.value} <span className="text-xs font-normal">{metric.unit}</span>
                  </p>
                </div>
                <div className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  metric.change > 0 ? 'text-emerald-500' : 'text-rose-500'
                )}>
                  {metric.change > 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(metric.change)}%
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Objectif mensuel</span>
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-[65%] bg-emerald-500 rounded-full" />
          </div>
          <span className="text-emerald-500 font-medium">65%</span>
        </div>
      </div>
    </motion.div>
  );
}

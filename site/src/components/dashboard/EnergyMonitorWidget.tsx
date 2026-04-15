import { motion } from 'framer-motion';
import { Leaf, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getHealthScore } from '@/lib/sensorData';
import { Skeleton } from '@/components/ui/skeleton';

interface EnergyMetric {
  label: string;
  value: string;
  change: number;
  unit: string;
}

interface EnergyMonitorWidgetProps {
  avgCo2: number;
  avgTemp: number;
  avgHumidity: number;
  onlineSensors: number;
  totalSensors: number;
  efficientSensors: number;
  isLoading?: boolean;
}

export function EnergyMonitorWidget({
  avgCo2,
  avgTemp,
  avgHumidity,
  onlineSensors,
  totalSensors,
  efficientSensors,
  isLoading = false,
}: EnergyMonitorWidgetProps) {
  const ecoScore = getHealthScore(avgCo2, avgTemp, avgHumidity);
  const efficiencyPercent = onlineSensors > 0 ? Math.round((efficientSensors / onlineSensors) * 100) : 0;
  const co2Delta = Math.round(((800 - avgCo2) / 800) * 100);
  const objectiveProgress = Math.max(0, Math.min(100, Math.round(ecoScore * 0.6 + efficiencyPercent * 0.4)));

  const metrics: EnergyMetric[] = [
    {
      label: 'CO2 moyen',
      value: Math.round(avgCo2 || 0).toString(),
      change: co2Delta,
      unit: 'ppm',
    },
    {
      label: 'Capteurs efficaces',
      value: `${efficientSensors}/${Math.max(onlineSensors, totalSensors, 1)}`,
      change: efficiencyPercent - 70,
      unit: '%',
    },
  ];

  const circumference = 2 * Math.PI * 40;
  const progress = (ecoScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/80 p-4 md:p-5',
        'bg-card/70 backdrop-blur-sm supports-[backdrop-filter]:bg-card/55'
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            Efficacité
          </div>
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-foreground">Éco-Score</h3>
          </div>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Énergie
        </span>
      </div>

      <div className="relative flex items-center gap-4">
        {isLoading ? (
          <>
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border/70 bg-background/50">
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="rounded-lg border border-border/70 bg-background/55 px-2.5 py-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-1.5 h-4 w-24" />
              </div>
              <div className="rounded-lg border border-border/70 bg-background/55 px-2.5 py-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="mt-1.5 h-4 w-20" />
              </div>
            </div>
          </>
        ) : (
          <>
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
          {metrics.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-background/45 p-3 text-xs text-muted-foreground">
              Aucune donnée énergétique
            </div>
          ) : (
            metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center justify-between rounded-lg border border-border/70 bg-background/55 px-2.5 py-2"
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
          </>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
        <span className="text-muted-foreground">Objectif mensuel</span>
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-full" />
            ) : (
              <motion.div
                className="h-full rounded-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${objectiveProgress}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-3 w-8" />
          ) : (
            <span className="text-emerald-500 font-medium">{objectiveProgress}%</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

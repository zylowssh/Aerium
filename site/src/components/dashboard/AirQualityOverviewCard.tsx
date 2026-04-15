import { memo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Radio, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { LiveIndicator } from '@/components/dashboard/LiveIndicator';
import { Co2DonutGauge } from '@/components/dashboard/Co2DonutGauge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Reading } from '@/lib/sensorData';
import { cn } from '@/lib/utils';

interface AirQualityOverviewCardProps {
  avgCo2: number;
  trendData: Reading[];
  isRefreshing: boolean;
  sensorsOnline: number;
  totalSensors: number;
  isLoading?: boolean;
}

function AirQualityOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-4 rounded-xl border border-border/70 bg-background/40 p-3">
        <div className="flex flex-col items-center">
          <Skeleton className="h-44 w-44 rounded-full" />
          <Skeleton className="mt-4 h-4 w-36" />
          <Skeleton className="mt-2 h-3 w-44" />
        </div>
      </div>

      <div className="lg:col-span-8 space-y-3">
        <div className="rounded-xl border border-border/70 bg-background/30 p-3">
          <Skeleton className="h-[220px] w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export const AirQualityOverviewCard = memo(function AirQualityOverviewCard({
  avgCo2,
  trendData,
  isRefreshing,
  sensorsOnline,
  totalSensors,
  isLoading = false,
}: AirQualityOverviewCardProps) {
  const hasData = trendData.length > 0;
  const peak = hasData ? Math.max(...trendData.map((d) => d.co2)) : null;
  const min = hasData ? Math.min(...trendData.map((d) => d.co2)) : null;
  const firstCo2 = hasData ? trendData[0].co2 : null;
  const latestCo2 = hasData ? trendData[trendData.length - 1].co2 : null;
  const trendDelta =
    firstCo2 !== null && latestCo2 !== null && firstCo2 !== 0
      ? Math.round(((latestCo2 - firstCo2) / firstCo2) * 100)
      : null;
  const isTrendImproving = trendDelta !== null && trendDelta <= 0;
  const trendLabel = trendDelta === null ? 'N/A' : `${trendDelta > 0 ? '+' : ''}${trendDelta}%`;
  const TrendIcon = isTrendImproving ? TrendingDown : TrendingUp;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative lg:col-span-2 overflow-hidden rounded-2xl border border-border/80 p-4 md:p-5',
        'bg-card/70 backdrop-blur-sm supports-[backdrop-filter]:bg-card/55'
      )}
      aria-labelledby="air-quality-overview"
    >
      <div
        className={cn(
          'pointer-events-none absolute -left-28 -top-28 h-56 w-56 rounded-full blur-3xl',
          'bg-primary/15'
        )}
      />
      <div
        className={cn(
          'pointer-events-none absolute -bottom-24 -right-24 h-56 w-56 rounded-full blur-3xl',
          'bg-accent/15'
        )}
      />

      <header className="relative mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            Synthèse 24h
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 id="air-quality-overview" className="text-base font-semibold text-foreground">
              Aperçu Qualité de l'Air
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Vue consolidée de la qualité de l'air sur vos capteurs actifs.
          </p>
        </div>
        <LiveIndicator isRefreshing={isRefreshing} />
      </header>

      {isLoading ? (
        <div className="relative">
          <AirQualityOverviewSkeleton />
        </div>
      ) : (
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-4 rounded-xl border border-border/70 bg-background/40 p-3">
            <Co2DonutGauge co2={avgCo2} size={170} />
          </div>

          <div className="lg:col-span-8 space-y-3">
            <div className="rounded-xl border border-border/70 bg-background/30 p-3">
              {hasData ? (
                <TrendChart title="Évolution CO₂" data={trendData} height={220} />
              ) : (
                <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-border/70 bg-background/40 px-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Données insuffisantes pour tracer la tendance.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
              <motion.div
                className="rounded-lg border border-border/70 bg-background/55 p-2.5"
                whileHover={{ y: -2 }}
              >
                <div className="mb-1 text-[11px] text-muted-foreground">Évolution 24h</div>
                <div
                  className={cn(
                    'flex items-center gap-1 text-base font-semibold tabular-nums',
                    trendDelta === null
                      ? 'text-muted-foreground'
                      : isTrendImproving
                        ? 'text-success'
                        : 'text-destructive'
                  )}
                >
                  <TrendIcon className="h-3.5 w-3.5" />
                  <span>{trendLabel}</span>
                </div>
              </motion.div>

              <motion.div
                className="rounded-lg border border-border/70 bg-background/55 p-2.5"
                whileHover={{ y: -2 }}
              >
                <div className="mb-1 text-[11px] text-muted-foreground">Niveau mini</div>
                <div className="text-base font-semibold text-foreground tabular-nums">
                  {min ?? '--'} <span className="text-xs font-normal text-muted-foreground">ppm</span>
                </div>
              </motion.div>

              <motion.div
                className="rounded-lg border border-border/70 bg-background/55 p-2.5"
                whileHover={{ y: -2 }}
              >
                <div className="mb-1 text-[11px] text-muted-foreground">Pic</div>
                <div className="flex items-center gap-1 text-base font-semibold text-foreground tabular-nums">
                  <Activity className="h-3.5 w-3.5 text-warning" />
                  <span>{peak ?? '--'}</span>
                  <span className="text-xs font-normal text-muted-foreground">ppm</span>
                </div>
              </motion.div>

              <motion.div
                className="rounded-lg border border-border/70 bg-background/55 p-2.5"
                whileHover={{ y: -2 }}
              >
                <div className="mb-1 text-[11px] text-muted-foreground">Capteurs actifs</div>
                <div className="flex items-center gap-1 text-base font-semibold text-foreground tabular-nums">
                  <Radio className="h-3.5 w-3.5 text-primary" />
                  <span>{sensorsOnline}</span>
                  <span className="text-xs font-normal text-muted-foreground">/ {totalSensors}</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
});
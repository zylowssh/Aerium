import { motion } from 'framer-motion';
import { Activity, Radio, Sparkles } from 'lucide-react';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { LiveIndicator } from '@/components/dashboard/LiveIndicator';
import { Co2DonutGauge } from '@/components/dashboard/Co2DonutGauge';
import type { Reading } from '@/lib/sensorData';
import { cn } from '@/lib/utils';
import { memo } from 'react';

interface AirQualityOverviewCardProps {
  avgCo2: number;
  trendData: Reading[];
  isRefreshing: boolean;
  sensorsOnline: number;
  totalSensors: number;
}

export const AirQualityOverviewCard = memo(function AirQualityOverviewCard({
  avgCo2,
  trendData,
  isRefreshing,
  sensorsOnline,
  totalSensors,
}: AirQualityOverviewCardProps) {
  const peak = trendData.length > 0 ? Math.max(...trendData.map((d) => d.co2)) : 0;
  const min = trendData.length > 0 ? Math.min(...trendData.map((d) => d.co2)) : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative lg:col-span-2 rounded-2xl border border-border p-4 overflow-hidden',
        'bg-card/50 backdrop-blur-sm'
      )}
      aria-labelledby="air-quality-overview"
    >
      {/* Ambient highlights */}
      <div
        className={cn(
          'pointer-events-none absolute -top-32 -left-32 h-64 w-64 rounded-full blur-3xl',
          'bg-primary/10'
        )}
      />
      <div
        className={cn(
          'pointer-events-none absolute -bottom-32 -right-32 h-64 w-64 rounded-full blur-3xl',
          'bg-accent/10'
        )}
      />

      <header className="relative flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 id="air-quality-overview" className="text-base font-semibold text-foreground">
            Aperçu Qualité de l'Air
          </h2>
        </div>
        <LiveIndicator isRefreshing={isRefreshing} />
      </header>

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Gauge + quick stats */}
        <div className="lg:col-span-4 flex flex-col items-center gap-4">
          <Co2DonutGauge co2={avgCo2} size={180} />

          <div className="w-full grid grid-cols-2 gap-2">
            <motion.div 
              className="rounded-lg border border-border bg-background/50 backdrop-blur-sm p-3 hover:border-primary/30 transition-colors"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Activity className="h-3.5 w-3.5 text-destructive" />
                <span>Pic</span>
              </div>
              <div className="text-base font-bold text-foreground tabular-nums">
                {peak} <span className="text-xs font-normal text-muted-foreground">ppm</span>
              </div>
            </motion.div>
            <motion.div 
              className="rounded-lg border border-border bg-background/50 backdrop-blur-sm p-3 hover:border-primary/30 transition-colors"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Radio className="h-3.5 w-3.5 text-primary" />
                <span>Actifs</span>
              </div>
              <div className="text-base font-bold text-foreground tabular-nums">
                {sensorsOnline}<span className="text-xs font-normal text-muted-foreground">/{totalSensors}</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Trend */}
        <div className="lg:col-span-8 rounded-xl border border-border bg-background/30 backdrop-blur-sm p-3">
          <TrendChart title={null} data={trendData} height={220} />
        </div>
      </div>
    </motion.section>
  );
});
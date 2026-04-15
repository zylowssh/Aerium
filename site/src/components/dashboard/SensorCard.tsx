import { motion } from 'framer-motion';
import { MapPin, Thermometer, Droplets, Activity } from 'lucide-react';
import { Sensor } from '@/lib/sensorData';
import { cn } from '@/lib/utils';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Skeleton } from '@/components/ui/skeleton';

interface MiniChartReadingPayload {
  co2: number;
}

export interface SensorCardProps {
  sensor: Sensor;
  miniChartData?: number[];
}

export function SensorCard({ sensor, miniChartData }: SensorCardProps) {
  const [chartData, setChartData] = useState<Array<{value: number, index: number}>>([]);
  const [loading, setLoading] = useState(true);
  const hasReading = sensor.hasReading !== false;
  const isDisconnectedRealSensor = sensor.sensorType === 'real' && sensor.status === 'hors ligne' && !hasReading;

  useEffect(() => {
    if (!hasReading) {
      setChartData([]);
      setLoading(false);
      return;
    }

    if (miniChartData) {
      setChartData(miniChartData.map((value, index) => ({ value, index })));
      setLoading(false);
    } else {
      // Fetch real data for mini chart
      fetchMiniChartData();
    }
  }, [sensor.id, miniChartData, hasReading]);

  const fetchMiniChartData = async () => {
    try {
      if (!hasReading) {
        setChartData([]);
        return;
      }

      setLoading(true);
      const readings = await apiClient.getSensorReadings(sensor.id, 6, 10);
      
      if (readings && readings.length > 0) {
        const co2Data = readings
          .reverse()
          .map((r: MiniChartReadingPayload, idx: number) => ({ value: r.co2, index: idx }));
        setChartData(co2Data);
      } else {
        setChartData(
          Array.from({ length: 10 }, (_, i) => ({
            value: sensor.co2,
            index: i
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching mini chart data:', error);
      // Use a deterministic fallback from current sensor value instead of random numbers.
      setChartData(
        Array.from({ length: 10 }, (_, i) => ({
          value: sensor.co2,
          index: i
        }))
      );
    } finally {
      setLoading(false);
    }
  };
  
  const statusColors = {
    'en ligne': 'bg-success',
    'hors ligne': 'bg-muted-foreground',
    'avertissement': 'bg-warning'
  };

  const statusBorderColors = {
    'en ligne': 'border-success/30',
    'hors ligne': 'border-muted-foreground/30',
    'avertissement': 'border-warning/30'
  };
  
  const getChartColor = () => {
    if (sensor.co2 < 800) return 'hsl(var(--primary))';
    if (sensor.co2 < 1000) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  const co2Display = hasReading ? String(sensor.co2) : '--';
  const statusLabel = sensor.status === 'en ligne'
    ? 'En Ligne'
    : sensor.status === 'avertissement'
      ? 'Avertissement'
      : isDisconnectedRealSensor
        ? 'Déconnecté'
        : 'Hors Ligne';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/80 p-5",
        "bg-card/70 backdrop-blur-sm supports-[backdrop-filter]:bg-card/55",
        "hover:border-primary/40 transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/10"
      )}
    >
      {/* Gradient overlay on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {sensor.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{sensor.location}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
              sensor.status === 'en ligne' 
                ? "bg-success/10 border-success/40 text-success"
                : sensor.status === 'avertissement'
                ? "bg-warning/10 border-warning/40 text-warning"
                : "bg-muted/50 border-muted-foreground/40 text-muted-foreground"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", statusColors[sensor.status])} />
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className={cn(
                "text-4xl font-bold tracking-tight",
                !hasReading ? "text-muted-foreground" : sensor.co2 < 800 ? "text-primary" : sensor.co2 < 1000 ? "text-warning" : "text-destructive"
              )}>
                {co2Display}
              </span>
              <span className="text-sm text-muted-foreground ml-1">{hasReading ? 'ppm' : ''}</span>
            </div>

            {!hasReading && (
              <span className="text-xs text-muted-foreground">Aucune mesure reçue</span>
            )}
            
            {sensor.isLive && hasReading && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="relative">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <div className="absolute inset-0 animate-ping">
                    <Activity className="w-3.5 h-3.5 text-primary opacity-75" />
                  </div>
                </div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Direct</span>
              </div>
            )}
          </div>

          {!loading && chartData.length > 0 && (
            <div className="h-12 w-28 rounded-lg border border-border/60 bg-background/45 px-1.5 py-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={getChartColor()}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {loading && hasReading && (
            <div className="h-12 w-28 rounded-lg border border-border/60 bg-background/45 px-1.5 py-1">
              <Skeleton className="h-full w-full rounded-md" />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-border/60 pt-4">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/55 px-3 py-1.5">
            <Thermometer className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-foreground">{hasReading ? `${sensor.temperature}°C` : '--'}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/55 px-3 py-1.5">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-foreground">{hasReading ? `${sensor.humidity}%` : '--'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { MapPin, Thermometer, Droplets, Activity, Wifi } from 'lucide-react';
import { Sensor, getAirQualityLevel } from '@/lib/sensorData';
import { cn } from '@/lib/utils';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';

export interface SensorCardProps {
  sensor: Sensor;
  miniChartData?: number[];
}

export function SensorCard({ sensor, miniChartData }: SensorCardProps) {
  const [chartData, setChartData] = useState<Array<{value: number, index: number}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (miniChartData) {
      setChartData(miniChartData.map((value, index) => ({ value, index })));
      setLoading(false);
    } else {
      // Fetch real data for mini chart
      fetchMiniChartData();
    }
  }, [sensor.id, miniChartData]);

  const fetchMiniChartData = async () => {
    try {
      setLoading(true);
      const readings = await apiClient.getSensorReadings(sensor.id, 6, 10);
      
      if (readings && readings.length > 0) {
        const co2Data = readings
          .reverse()
          .map((r: any, idx: number) => ({ value: r.co2, index: idx }));
        setChartData(co2Data);
      }
    } catch (error) {
      console.error('Error fetching mini chart data:', error);
      // Generate fallback data
      setChartData(
        Array.from({ length: 10 }, (_, i) => ({
          value: 700 + Math.random() * 200,
          index: i
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const level = getAirQualityLevel(sensor.co2);
  
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative p-5 rounded-xl bg-card/50 backdrop-blur-sm border border-border",
        "hover:border-primary/40 transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/5 overflow-hidden"
      )}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
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
                ? "bg-success/10 border-success/30 text-success"
                : sensor.status === 'avertissement'
                ? "bg-warning/10 border-warning/30 text-warning"
                : "bg-muted border-muted-foreground/30 text-muted-foreground"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", statusColors[sensor.status])} />
              {sensor.status === 'en ligne' ? 'En Ligne' : sensor.status === 'avertissement' ? 'Avertissement' : 'Hors Ligne'}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className={cn(
                "text-4xl font-bold tracking-tight",
                sensor.co2 < 800 ? "text-primary" : sensor.co2 < 1000 ? "text-warning" : "text-destructive"
              )}>
                {sensor.co2}
              </span>
              <span className="text-sm text-muted-foreground ml-1">ppm</span>
            </div>
            
            {sensor.isLive && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="relative">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <div className="absolute inset-0 animate-ping">
                    <Activity className="w-3.5 h-3.5 text-primary opacity-75" />
                  </div>
                </div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Live</span>
              </div>
            )}
          </div>

          {!loading && chartData.length > 0 && (
            <div className="w-28 h-12">
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
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
            <Thermometer className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-foreground">{sensor.temperature}°C</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-foreground">{sensor.humidity}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

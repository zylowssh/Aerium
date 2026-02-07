import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
 import { BarChart3, TrendingUp, Calendar, Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, BarChart, Bar } from 'recharts';
import { format, subDays } from 'date-fns';
import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useSensors } from '@/hooks/useSensors';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

interface Reading {
  recorded_at: string;
  co2: number;
  temperature: number;
  humidity: number;
}

const Analytics = () => {
  const { sensors } = useSensors();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  
  // Fetch real data based on time range
  useEffect(() => {
    const fetchData = async () => {
      if (sensors.length === 0) {
        setReadings([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
        const limit = timeRange === '24h' ? 48 : timeRange === '7d' ? 168 : 360;
        
        // Fetch readings for all sensors
        const allReadings = await Promise.all(
          sensors.map(sensor => 
            apiClient.getSensorReadings(sensor.id.toString(), hours, limit)
              .catch(() => [])
          )
        );
        
        // Flatten and sort by timestamp
        const combinedReadings = allReadings
          .flat()
          .sort((a: Reading, b: Reading) => 
            new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
          );
        
        setReadings(combinedReadings);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [sensors.length, timeRange]);

  // Process data for chart
  const chartData = useMemo(() => {
    if (readings.length === 0) return [];
    
    // Group readings by time period
    const groupedData = new Map<string, Reading[]>();
    
    readings.forEach(reading => {
      const date = new Date(reading.recorded_at);
      let key: string;
      
      if (timeRange === '24h') {
        key = format(date, 'h a');
      } else if (timeRange === '7d') {
        key = format(date, 'EEE');
      } else {
        key = format(date, 'MMM d');
      }
      
      if (!groupedData.has(key)) {
        groupedData.set(key, []);
      }
      groupedData.get(key)!.push(reading);
    });
    
    return Array.from(groupedData.entries()).map(([time, readings]) => ({
      time,
      co2: Math.round(readings.reduce((sum, r) => sum + r.co2, 0) / readings.length),
      temp: Math.round(readings.reduce((sum, r) => sum + r.temperature, 0) / readings.length * 10) / 10,
      humidity: Math.round(readings.reduce((sum, r) => sum + r.humidity, 0) / readings.length)
    }));
  }, [readings, timeRange]);

  // Calculate weekly comparison data
  const weeklyData = useMemo(() => {
    if (readings.length === 0) return [];
    
    const dayGroups = new Map<string, number[]>();
    
    readings.forEach(reading => {
      const day = format(new Date(reading.recorded_at), 'EEE');
      if (!dayGroups.has(day)) {
        dayGroups.set(day, []);
      }
      dayGroups.get(day)!.push(reading.co2);
    });
    
    return Array.from(dayGroups.entries()).map(([day, co2Values]) => ({
      day,
      avg: Math.round(co2Values.reduce((a, b) => a + b, 0) / co2Values.length),
      peak: Math.max(...co2Values)
    }));
  }, [readings]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (readings.length === 0) {
      return {
        goodRangePercent: 0,
        avgPeak: 0,
        peakTime: 'N/A'
      };
    }
    
    const goodRange = readings.filter(r => r.co2 < 800).length;
    const goodRangePercent = Math.round((goodRange / readings.length) * 100);
    
    const peakCo2 = Math.max(...readings.map(r => r.co2));
    const peakReading = readings.find(r => r.co2 === peakCo2);
    const peakTime = peakReading ? format(new Date(peakReading.recorded_at), 'h:mm a') : 'N/A';
    
    return {
      goodRangePercent,
      avgPeak: peakCo2,
      peakTime
    };
  }, [readings]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.name === 'co2' ? 'ppm' : entry.name === 'temp' ? '°C' : '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
     <AppLayout title="Analyses" subtitle="Analyse approfondie de vos données de qualité de l'air">
       <div className="space-y-6" data-tour="analytics-page">
        {/* Time Range Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(['24h', '7d', '30d'] as const).map((range) => (
              <Button
                key={range}
                variant={range === timeRange ? 'default' : 'outline'}
                size="sm"
                className={range === timeRange ? 'gradient-primary text-primary-foreground' : ''}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
          
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </div>

        {/* Statistics Cards */}
        {isLoading ? (
          <LoadingSkeleton variant="stats" count={4} />
        ) : (
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-tour="analytics-stats">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-card border border-border"
          >
            <p className="text-xs text-muted-foreground mb-1">Bonne Qualité</p>
            <p className="text-2xl font-bold text-primary">{stats.goodRangePercent}%</p>
            <p className="text-xs text-muted-foreground mt-1">du temps</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-4 rounded-lg bg-card border border-border"
          >
            <p className="text-xs text-muted-foreground mb-1">Pic CO₂</p>
            <p className="text-2xl font-bold text-destructive">{stats.avgPeak}</p>
            <p className="text-xs text-muted-foreground mt-1">ppm</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-lg bg-card border border-border"
          >
            <p className="text-xs text-muted-foreground mb-1">Heure Idéale</p>
            <p className="text-2xl font-bold text-success">{stats.peakTime}</p>
            <p className="text-xs text-muted-foreground mt-1">meilleure qualité</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-4 rounded-lg bg-card border border-border"
          >
            <p className="text-xs text-muted-foreground mb-1">Lectures</p>
            <p className="text-2xl font-bold text-primary">{readings.length}</p>
            <p className="text-xs text-muted-foreground mt-1">enregistrées</p>
          </motion.div>
        </div>
        )}

        {/* Multi-metric Chart */}
        {isLoading ? (
          <LoadingSkeleton variant="trend-chart" />
        ) : readings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center p-12 rounded-xl border border-border bg-card"
          >
            <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Aucune donnée disponible</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Ajoutez des capteurs pour commencer à collecter des données et visualiser les analyses.
            </p>
          </motion.div>
        ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
           className="p-6 rounded-xl bg-card border border-border"
           data-tour="analytics-charts"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Métriques Environnementales</h2>
              <p className="text-sm text-muted-foreground">Tendances du CO₂, de la température et de l'humidité</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">CO₂</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-sm text-muted-foreground">Temp</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm text-muted-foreground">Humidité</span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="co2AreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <YAxis 
                yAxisId="co2"
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                domain={[400, 1400]}
              />
              <YAxis 
                yAxisId="temp"
                orientation="right"
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                domain={[15, 35]}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Area
                yAxisId="co2"
                type="monotone"
                dataKey="co2"
                stroke="none"
                fill="url(#co2AreaGradient)"
              />
              <Line
                yAxisId="co2"
                type="monotone"
                dataKey="co2"
                name="CO₂"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="temp"
                name="Temperature"
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="humidity"
                name="Humidity"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>
        )}

        {/* Weekly Comparison */}
        {!isLoading && readings.length > 0 && weeklyData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Comparaison Hebdomadaire</h2>
              <p className="text-sm text-muted-foreground">Niveaux moyens vs pics de CO₂ par jour</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg" name="Average" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="peak" name="Peak" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        )}

        {/* Stats Grid */}
        {!isLoading && readings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Temps dans la Bonne Plage', value: `${stats.goodRangePercent}%`, description: 'CO₂ en dessous de 800ppm', trend: '+5%' },
            { label: 'Pic de CO₂', value: `${stats.avgPeak.toLocaleString()} ppm`, description: `Pic à ${stats.peakTime}`, trend: '-12%' },
            { label: 'Lectures Totales', value: readings.length.toString(), description: `Sur ${timeRange === '24h' ? '24 heures' : timeRange === '7d' ? '7 jours' : '30 jours'}`, trend: '+8' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 2) }}
              className="p-5 rounded-xl bg-card border border-border"
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{stat.description}</span>
                <span className="text-xs font-medium text-success">{stat.trend}</span>
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Analytics;

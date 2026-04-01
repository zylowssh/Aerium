import { AppLayout } from '@/components/layout/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Minus, Calendar, Download, Bot, Sparkles, RefreshCw, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, BarChart, Bar, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useSensors } from '@/hooks/useSensors';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { cn } from '@/lib/utils';
import MarkdownRenderer from '@/components/MarkdownRenderer';

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
  const [isExporting, setIsExporting] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Predictions state
  const [predictions, setPredictions]     = useState<any>(null);
  const [predLoading, setPredLoading]     = useState(false);
  const [predError,   setPredError]       = useState<string | null>(null);
  const [predOpen,    setPredOpen]        = useState(false);

  const fetchPredictions = useCallback(async () => {
    setPredLoading(true);
    setPredError(null);
    try {
      const data = await apiClient.getAIPredictions();
      setPredictions(data);
      setPredOpen(true);
    } catch (e: any) {
      setPredError(e?.response?.data?.error || 'Impossible de générer les prédictions.');
      setPredOpen(true);
    } finally {
      setPredLoading(false);
    }
  }, []);
  
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

  const handleExportCSV = () => {
    if (chartData.length === 0) {
      return;
    }

    try {
      setIsExporting(true);
      const header = ['periode', 'co2_ppm', 'temperature_c', 'humidity_percent'];
      const rows = chartData.map((row) => [
        String(row.time),
        String(row.co2),
        String(row.temp),
        String(row.humidity),
      ]);

      const csvContent = [header, ...rows]
        .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
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
          
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExportCSV}
            disabled={isExporting || chartData.length === 0}
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Export...' : 'Exporter'}
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

        {/* ===== AI PREDICTIONS SECTION ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          {/* Collapsible header */}
          <button
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
            onClick={() => predOpen ? setPredOpen(false) : (predictions ? setPredOpen(true) : fetchPredictions())}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  Prédictions IA — 24h
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </p>
                <p className="text-xs text-muted-foreground">
                  {predictions
                    ? `Basé sur ${predictions.data_hours}h de données · Généré à ${new Date(predictions.generated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                    : 'Prévisions CO₂, température et humidité par Aéria'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {predictions && (
                <Button
                  variant="ghost" size="sm"
                  className="text-xs gap-1 text-muted-foreground h-7"
                  onClick={(e) => { e.stopPropagation(); fetchPredictions(); }}
                >
                  <RefreshCw className="w-3 h-3" /> Actualiser
                </Button>
              )}
              {!predictions && !predLoading && (
                <Badge variant="outline" className="text-xs">
                  Cliquer pour générer
                </Badge>
              )}
              {predLoading && <RefreshCw className="w-4 h-4 text-primary animate-spin" />}
              {predOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>

          {/* Collapsible body */}
          <AnimatePresence initial={false}>
            {predOpen && (
              <motion.div
                key="pred-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 border-t border-border space-y-5 pt-5">
                  {predLoading && (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <div className="relative w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-primary" />
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary animate-ping opacity-60" />
                      </div>
                      <p className="text-sm text-muted-foreground">Aéria calcule vos prévisions…</p>
                    </div>
                  )}

                  {predError && !predLoading && (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                      <AlertTriangle className="w-8 h-8 text-destructive/60" />
                      <p className="text-sm text-muted-foreground">{predError}</p>
                      <Button variant="outline" size="sm" onClick={fetchPredictions}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
                      </Button>
                    </div>
                  )}

                  {predictions && !predLoading && (() => {
                    const p = predictions;
                    const trends = p.trends || {};
                    const TrendIcon = trends.co2_direction === 'rising'
                      ? TrendingUp
                      : trends.co2_direction === 'falling'
                      ? TrendingDown
                      : Minus;
                    const trendColor = trends.co2_direction === 'rising'
                      ? 'text-destructive'
                      : trends.co2_direction === 'falling'
                      ? 'text-green-500'
                      : 'text-muted-foreground';
                    const riskColors: Record<string, string> = {
                      low:      'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30',
                      moderate: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
                      high:     'bg-destructive/10 text-destructive border-destructive/30',
                    };

                    return (
                      <>
                        {/* Trend summary cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 rounded-lg bg-muted/50 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Tendance CO₂</p>
                            <div className="flex items-center gap-1">
                              <TrendIcon className={cn('w-4 h-4', trendColor)} />
                              <span className={cn('text-sm font-semibold', trendColor)}>
                                {trends.co2_direction === 'rising'  ? 'En hausse'
                                  : trends.co2_direction === 'falling' ? 'En baisse'
                                  : 'Stable'}
                              </span>
                            </div>
                            {trends.co2_change_pct !== undefined && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {trends.co2_change_pct > 0 ? '+' : ''}{Math.round(trends.co2_change_pct)}% sur 24h
                              </p>
                            )}
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Pic prévu</p>
                            <p className="text-sm font-semibold text-foreground">{trends.peak_co2 ?? '—'} ppm</p>
                            {trends.peak_hour && (
                              <p className="text-xs text-muted-foreground mt-0.5">vers {trends.peak_hour}</p>
                            )}
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Niveau de risque</p>
                            <Badge
                              variant="outline"
                              className={cn('text-xs capitalize mt-0.5', riskColors[trends.risk_level] ?? '')}
                            >
                              {trends.risk_level === 'low'      ? 'Faible'
                                : trends.risk_level === 'moderate' ? 'Modéré'
                                : trends.risk_level === 'high'     ? 'Élevé'
                                : '—'}
                            </Badge>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Données sources</p>
                            <p className="text-sm font-semibold text-foreground">{p.data_hours}h</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{p.reading_count} lectures</p>
                          </div>
                        </div>

                        {/* Forecast chart */}
                        {p.forecast && p.forecast.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-foreground mb-3">Prévision CO₂ — prochaines 24h</p>
                            <ResponsiveContainer width="100%" height={260}>
                              <ComposedChart data={p.forecast} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis
                                  dataKey="hour"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                  interval={2}
                                />
                                <YAxis
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                  domain={['auto', 'auto']}
                                />
                                <Tooltip
                                  contentStyle={{
                                    background: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                  }}
                                  formatter={(v: any, name: string) => [
                                    `${Math.round(v)} ppm`,
                                    name === 'co2' ? 'CO₂ prévu'
                                      : name === 'co2_upper' ? 'Borne haute'
                                      : 'Borne basse',
                                  ]}
                                />
                                {/* Confidence band */}
                                <Area
                                  type="monotone"
                                  dataKey="co2_upper"
                                  stroke="none"
                                  fill="hsl(var(--primary))"
                                  fillOpacity={0.08}
                                  legendType="none"
                                />
                                <Area
                                  type="monotone"
                                  dataKey="co2_lower"
                                  stroke="none"
                                  fill="hsl(var(--background))"
                                  fillOpacity={1}
                                  legendType="none"
                                />
                                {/* Main forecast line */}
                                <Line
                                  type="monotone"
                                  dataKey="co2"
                                  stroke="hsl(var(--primary))"
                                  strokeWidth={2}
                                  dot={false}
                                  strokeDasharray="5 3"
                                />
                                {/* Thresholds */}
                                <ReferenceLine y={800}  stroke="hsl(var(--warning))"     strokeDasharray="4 3" strokeWidth={1} label={{ value: '800', fill: 'hsl(var(--warning))',     fontSize: 10, position: 'right' }} />
                                <ReferenceLine y={1000} stroke="hsl(var(--destructive))" strokeDasharray="4 3" strokeWidth={1} label={{ value: '1000', fill: 'hsl(var(--destructive))', fontSize: 10, position: 'right' }} />
                              </ComposedChart>
                            </ResponsiveContainer>
                            <p className="text-xs text-muted-foreground mt-1">
                              Zone ombrée = intervalle de confiance · Lignes pointillées = seuils d'alerte
                            </p>
                          </div>
                        )}

                        {/* AI Narrative */}
                        {p.narrative && (
                          <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
                            <div className="flex items-center gap-2 mb-2">
                              <Bot className="w-4 h-4 text-primary" />
                              <span className="text-xs font-medium text-primary">Analyse Aéria</span>
                            </div>
                            <MarkdownRenderer content={p.narrative} />
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </AppLayout>
  );
};

export default Analytics;

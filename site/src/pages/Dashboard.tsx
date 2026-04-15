import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Droplets, Activity, Heart, Plus, Download, BellRing } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { AirQualityOverviewCard } from '@/components/dashboard/AirQualityOverviewCard';
import { SensorCard } from '@/components/dashboard/SensorCard';
import { AlertCard } from '@/components/dashboard/AlertCard';
import { QuickInsights } from '@/components/dashboard/QuickInsights';
import { MaintenanceWidget } from '@/components/dashboard/MaintenanceWidget';
import { PredictiveAlertsWidget } from '@/components/dashboard/PredictiveAlertsWidget';
import { EnergyMonitorWidget } from '@/components/dashboard/EnergyMonitorWidget';
import { OccupancyWidget } from '@/components/dashboard/OccupancyWidget';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { useSensors } from '@/hooks/useSensors';
import { apiClient } from '@/lib/apiClient';
import AddSensorDialog from '@/components/sensors/AddSensorDialog';
import { Button } from '@/components/ui/button';
 import { TourGuide } from '@/components/tour/TourGuide';
 import { useTourContext } from '@/contexts/TourContext';
import { 
  getHealthScore,
  Alert,
  Reading
} from '@/lib/sensorData';

interface SensorReadingPayload {
  co2: number;
  recorded_at: string;
}

const Dashboard = () => {
  const { sensors, isLoading } = useSensors();
   const { 
     isOpen: isTourOpen, 
     currentStep, 
     totalSteps, 
     currentStepData, 
     nextStep, 
     prevStep, 
     skipTour, 
     completeTour 
   } = useTourContext();
  const [trendData, setTrendData] = useState<Reading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [sensorReadings, setSensorReadings] = useState<Record<string, number[]>>({});
  const [isTrendLoading, setIsTrendLoading] = useState(true);
  const [isAlertsLoading, setIsAlertsLoading] = useState(true);
  const isFetchingTrend = useRef(false);
  const isFetchingReadings = useRef(false);
  const prevSensorsLength = useRef(0);
  const [aggregateData, setAggregateData] = useState({
    avgCo2: 0,
    avgTemp: 0,
    avgHumidity: 0,
    totalReadings: 0
  });

  // Fetch aggregate data - only when sensors length actually changes
  useEffect(() => {
    const fetchAggregate = async () => {
      try {
        const data = await apiClient.getAggregateData();
        setAggregateData({
          avgCo2: Math.round(data.avgCo2),
          avgTemp: data.avgTemperature,
          avgHumidity: Math.round(data.avgHumidity),
          totalReadings: Math.round(data.totalReadings || 0)
        });
      } catch (error) {
        console.error('Error fetching aggregate data:', error);
      }
    };

    // Fetch on first non-empty load and whenever sensor count changes.
    const lengthChanged = sensors.length !== prevSensorsLength.current;
    if (sensors.length > 0 && lengthChanged) {
      prevSensorsLength.current = sensors.length;
      fetchAggregate();
    }
    if (sensors.length === 0) {
      prevSensorsLength.current = 0;
    }
  }, [sensors.length]);

  // Export alerts to CSV
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const blob = await apiClient.exportAlertsCSV(30);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `alertes-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Refresh alerts after status change
  const refreshAlerts = async () => {
    try {
      const data = await apiClient.getAlerts();
      setAlerts(data.slice(0, 20) || []);
    } catch (error) {
      console.error('Error refreshing alerts:', error);
    }
  };

  // Fetch alerts - only on mount, then poll
  useEffect(() => {
    const fetchAlerts = async () => {
      setIsAlertsLoading(true);
      try {
        const alertsData = await apiClient.getAlerts('nouvelle', 5);
        setAlerts(alertsData);
      } catch (error) {
        console.error('Error fetching alerts:', error);
        setAlerts([]);
      } finally {
        setIsAlertsLoading(false);
      }
    };

    fetchAlerts();
    // WebSocket provides real-time updates, no polling needed
  }, []); // Empty dependency array - only runs once on mount

  // Fetch historical readings for mini charts in a lightweight way.
  useEffect(() => {
    const fetchSensorReadings = async () => {
      if (isFetchingReadings.current || sensors.length === 0) return;
      
      // Check if sensors length actually changed
      if (sensors.length === prevSensorsLength.current && Object.keys(sensorReadings).length > 0) {
        return;
      }
      
      isFetchingReadings.current = true;
      const readings: Record<string, number[]> = {};
      const sensorsForMiniCharts = sensors.slice(0, 6);
      
      try {
        await Promise.all(sensorsForMiniCharts.map(async (sensor) => {
          try {
            const data = await apiClient.getSensorReadings(sensor.id.toString(), 2, 8);
            readings[sensor.id] = (data as SensorReadingPayload[]).map((r) => r.co2).reverse();
          } catch (error) {
            console.error(`Error fetching readings for sensor ${sensor.id}:`, error);
            readings[sensor.id] = [];
          }
        }));
        
        setSensorReadings(readings);
      } finally {
        isFetchingReadings.current = false;
      }
    };

    fetchSensorReadings();
  }, [sensors.length]); // Only depend on sensors length, not the array itself

  // Fetch aggregate trend data for overview chart with lighter payloads.
  useEffect(() => {
    const fetchTrendData = async () => {
      if (isLoading) {
        return;
      }

      if (isFetchingTrend.current || sensors.length === 0) {
        if (!isLoading && sensors.length === 0) {
          setTrendData([]);
          setIsTrendLoading(false);
        }
        return;
      }

      // Check if sensors length actually changed or if it's initial load
      const isInitialLoad = trendData.length === 0 && !isFetchingTrend.current;
      if (!isInitialLoad && sensors.length === prevSensorsLength.current) {
        return;
      }

      isFetchingTrend.current = true;
      setIsTrendLoading(true);

      try {
        const sensorsForTrend = sensors.slice(0, 8);

        // Fetch readings for a representative sensor subset in parallel.
        const allSensorReadings = await Promise.all(
          sensorsForTrend.map(sensor => 
            apiClient.getSensorReadings(sensor.id.toString(), 6, 24)
              .catch(() => []) // Return empty array if error
          )
        );
        
        // Create a map of timestamp -> CO2 values
        const timeMap = new Map<number, number[]>();
        
        allSensorReadings.forEach(readings => {
          (readings as SensorReadingPayload[]).forEach((reading) => {
            const timestamp = new Date(reading.recorded_at).getTime();
            // Round to nearest 30 seconds for grouping (30000 ms)
            const roundedTime = Math.floor(timestamp / 30000) * 30000;
            
            if (!timeMap.has(roundedTime)) {
              timeMap.set(roundedTime, []);
            }
            timeMap.get(roundedTime)!.push(reading.co2);
          });
        });
        
        // Convert map to sorted array of averaged readings.
        const trendReadings: Reading[] = Array.from(timeMap.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([timestamp, co2Values]) => ({
            timestamp: new Date(timestamp),
            co2: Math.round(co2Values.reduce((sum, val) => sum + val, 0) / co2Values.length),
            temperature: 0,
            humidity: 0
          }));
        
        setTrendData(trendReadings);
      } catch (error) {
        console.error('Error fetching trend data:', error);
        setTrendData([]);
      } finally {
        isFetchingTrend.current = false;
        setIsTrendLoading(false);
      }
    };

    fetchTrendData();
    // Initial load only - WebSocket provides real-time sensor updates
  }, [isLoading, sensors.length]);

  // WebSocket listener for real-time aggregate updates - recalculate when sensors change
  useEffect(() => {
    if (sensors.length > 0) {
      const capteursAvecMesures = sensors.filter((sensor) => sensor.hasReading !== false);
      if (capteursAvecMesures.length === 0) {
        setAggregateData((prev) => ({
          ...prev,
          avgCo2: 0,
          avgTemp: 0,
          avgHumidity: 0,
        }));
        return;
      }

      setAggregateData((prev) => ({
        ...prev,
        avgCo2: Math.round(capteursAvecMesures.reduce((acc, s) => acc + s.co2, 0) / capteursAvecMesures.length),
        avgTemp: parseFloat((capteursAvecMesures.reduce((acc, s) => acc + s.temperature, 0) / capteursAvecMesures.length).toFixed(1)),
        avgHumidity: Math.round(capteursAvecMesures.reduce((acc, s) => acc + s.humidity, 0) / capteursAvecMesures.length)
      }));
    }
  }, [sensors]); // Recalculate whenever sensors array changes (includes WebSocket updates)

  const capteursAvecMesures = sensors.filter((sensor) => sensor.hasReading !== false);

  // Calculate aggregate metrics from sensors if no backend data
  const avgCo2 = aggregateData.avgCo2 || (capteursAvecMesures.length > 0 ? Math.round(capteursAvecMesures.reduce((acc, s) => acc + s.co2, 0) / capteursAvecMesures.length) : 0);
  const avgTemp = aggregateData.avgTemp || (capteursAvecMesures.length > 0 ? (capteursAvecMesures.reduce((acc, s) => acc + s.temperature, 0) / capteursAvecMesures.length).toFixed(1) : '0');
  const avgHumidity = aggregateData.avgHumidity || (capteursAvecMesures.length > 0 ? Math.round(capteursAvecMesures.reduce((acc, s) => acc + s.humidity, 0) / capteursAvecMesures.length) : 0);
  const healthScore = getHealthScore(avgCo2, parseFloat(String(avgTemp)), avgHumidity);
  const readingsToday = aggregateData.totalReadings || trendData.length;

  const firstCo2 = trendData.length > 0 ? trendData[0].co2 : null;
  const latestCo2 = trendData.length > 0 ? trendData[trendData.length - 1].co2 : null;
  const co2Trend =
    firstCo2 !== null && latestCo2 !== null && firstCo2 !== 0
      ? Math.round(((latestCo2 - firstCo2) / firstCo2) * 100)
      : undefined;

  const previousHealthScore =
    firstCo2 !== null ? getHealthScore(firstCo2, parseFloat(String(avgTemp)), avgHumidity) : healthScore;
  const healthTrend = Math.round(healthScore - previousHealthScore);

  const bestAirReading =
    trendData.length > 0
      ? trendData.reduce((best, current) => (current.co2 < best.co2 ? current : best), trendData[0])
      : null;
  const bestAirTime = bestAirReading
    ? bestAirReading.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  const sensorsOnline = sensors.filter(s => s.status === 'en ligne').length;
  const totalSensors = sensors.length;
  const efficientSensors = sensors.filter(
    (sensor) => sensor.status === 'en ligne' && sensor.hasReading !== false && Number(sensor.co2 || 0) < 900
  ).length;
  const isMetricsLoading = isLoading || isTrendLoading;

  return (
    <AppLayout>
       <div className="space-y-4" data-tour="dashboard">
        {/* Air Quality Overview */}
        <div data-tour="air-quality">
          <AirQualityOverviewCard
            key="air-quality-overview"
            avgCo2={avgCo2}
            trendData={trendData}
            isRefreshing={isRefreshing}
            sensorsOnline={sensorsOnline}
            totalSensors={totalSensors}
            isLoading={isTrendLoading}
          />
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <LoadingSkeleton variant="kpi" count={4} />
        ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="kpi-cards">
          <KPICard 
            label="CO₂ Moyen" 
            value={avgCo2} 
            unit="ppm" 
            icon={Activity}
            trend={co2Trend}
            trendLabel="sur la période"
            status={avgCo2 < 800 ? 'success' : avgCo2 < 1000 ? 'warning' : 'danger'}
          />
          <KPICard 
            label="Température" 
            value={avgTemp} 
            unit="°C" 
            icon={Thermometer}
            status="default"
          />
          <KPICard 
            label="Humidité" 
            value={avgHumidity} 
            unit="%" 
            icon={Droplets}
            status="default"
          />
          <KPICard 
            label="Score de Santé" 
            value={healthScore} 
            unit="/100" 
            icon={Heart}
            trend={healthTrend}
            trendLabel="sur la période"
            status={healthScore >= 80 ? 'success' : healthScore >= 60 ? 'warning' : 'danger'}
          />
        </div>
        )}

        {/* Alerts and Insights Below */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-tour="alerts">
          {/* Recent Alerts */}
          {isAlertsLoading ? (
            <LoadingSkeleton variant="alerts" count={3} />
          ) : (
          <motion.div
            key="recent-alerts-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-border/80 p-4 md:p-5 bg-card/70 backdrop-blur-sm supports-[backdrop-filter]:bg-card/55"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-destructive/10 blur-3xl" />

            <div className="relative mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  Priorité en cours
                </div>
                <div className="flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Alertes Récentes</h3>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5 text-xs"
                onClick={handleExportCSV}
                disabled={isExporting}
              >
                <Download className="w-3 h-3" />
                {isExporting ? 'Exportation...' : 'CSV'}
              </Button>
            </div>
            <div className="relative space-y-1.5">
              {alerts.slice(0, 3).length > 0 ? (
                alerts.slice(0, 3).map((alert: Alert) => (
                  <AlertCard key={alert.id} alert={alert} onStatusChange={refreshAlerts} />
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Aucune alerte</p>
                </div>
              )}
            </div>
          </motion.div>
          )}

          {/* Quick Insights */}
          <QuickInsights
            sensorsOnline={sensorsOnline}
            totalSensors={totalSensors}
            readingsToday={readingsToday}
            peakCO2={trendData.length > 0 ? Math.max(...trendData.map(d => d.co2)) : 0}
            bestAirTime={bestAirTime}
            isLoading={isMetricsLoading}
          />
        </div>

        {/* Secondary Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MaintenanceWidget />
          <PredictiveAlertsWidget />
          <EnergyMonitorWidget
            avgCo2={avgCo2}
            avgTemp={parseFloat(String(avgTemp))}
            avgHumidity={avgHumidity}
            onlineSensors={sensorsOnline}
            totalSensors={totalSensors}
            efficientSensors={efficientSensors}
            isLoading={isMetricsLoading}
          />
          <OccupancyWidget />
        </div>

        {/* Active Sensors */}
         <div data-tour="sensors" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Capteurs Actifs</h2>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Ajouter un Capteur
            </Button>
          </div>
          {isLoading ? (
            <LoadingSkeleton variant="sensor" count={3} />
          ) : sensors.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center p-12 rounded-xl border-2 border-dashed border-border bg-muted/20"
            >
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Aucun capteur configuré</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                Commencez à surveiller la qualité de l'air en ajoutant votre premier capteur. 
                Choisissez entre un capteur réel ou une simulation.
              </p>
              <Button 
                className="gap-2"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Ajouter votre premier capteur
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sensors.map((sensor) => (
                <SensorCard 
                  key={sensor.id} 
                  sensor={sensor}
                  miniChartData={sensorReadings[sensor.id] || []}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add Sensor Dialog */}
        <AddSensorDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
         
         {/* Tour Guide */}
         <TourGuide
           isOpen={isTourOpen}
           currentStep={currentStep}
           totalSteps={totalSteps}
           stepData={currentStepData}
           onNext={nextStep}
           onPrev={prevStep}
           onSkip={skipTour}
           onComplete={completeTour}
         />
      </div>
    </AppLayout>
  );
};

export default Dashboard;

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Sensor } from '@/lib/sensorData';
import { useWebSocket } from '@/contexts/WebSocketContext';

const SENSORS_REFRESH_EVENT = 'aerium:sensors:refresh';

const emitSensorsRefresh = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SENSORS_REFRESH_EVENT));
};

const normalizeSensorStatus = (status: unknown): Sensor['status'] => {
  if (status === 'en ligne' || status === 'hors ligne' || status === 'avertissement') {
    return status;
  }
  return 'hors ligne';
};

const normalizeSensorType = (sensorType: unknown): 'real' | 'simulation' => {
  return String(sensorType || '').toLowerCase() === 'real' ? 'real' : 'simulation';
};

const toFiniteNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const useSensors = () => {
  const { socket } = useWebSocket();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasAccessToken = () => !!localStorage.getItem('access_token');

  const fetchSensors = useCallback(async () => {
    if (!hasAccessToken()) {
      setSensors([]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiClient.getSensors();
      
      const mappedSensors: Sensor[] = data.map((s: any) => {
        const sensorType = normalizeSensorType(s.sensor_type);
        const hasReading = Boolean(s.lastReading);
        const statusFromApi = normalizeSensorStatus(s.status);
        const status = sensorType === 'real' && !hasReading ? 'hors ligne' : statusFromApi;

        return {
          id: String(s.id),
          name: s.name,
          location: s.location,
          status,
          co2: toFiniteNumber(s.co2),
          temperature: toFiniteNumber(s.temperature),
          humidity: toFiniteNumber(s.humidity),
          lastReading: hasReading ? new Date(s.lastReading) : null,
          battery: sensorType === 'simulation' ? undefined : (s.battery ?? undefined),
          isLive: sensorType === 'real' ? Boolean(s.is_live ?? hasReading) : true,
          sensorType,
          hasReading,
          sensorModel: s.sensor_model ?? undefined,
          connectionMethod: s.connection_method ?? undefined,
          thresholds: s.thresholds ?? undefined,
        };
      });

      setSensors(mappedSensors);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching sensors:', err);
      setError(err.response?.data?.error || 'Erreur lors du chargement des capteurs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);

  useEffect(() => {
    const handleSensorsRefresh = () => {
      fetchSensors();
    };

    window.addEventListener(SENSORS_REFRESH_EVENT, handleSensorsRefresh);
    return () => {
      window.removeEventListener(SENSORS_REFRESH_EVENT, handleSensorsRefresh);
    };
  }, [fetchSensors]);

  // Setup WebSocket listener for sensor updates
  useEffect(() => {
    if (!socket) return;

    const handleSensorUpdate = (data: any) => {
      const { sensor_id, reading } = data;
      const normalizedSensorId = String(sensor_id);

      setSensors((prev) =>
        prev.map((sensor) =>
          sensor.id === normalizedSensorId
            ? (() => {
                const nextStatus = normalizeSensorStatus(data.status ?? sensor.status);
                return {
                  ...sensor,
                  status: nextStatus,
                  co2: toFiniteNumber(reading.co2),
                  temperature: toFiniteNumber(reading.temperature),
                  humidity: toFiniteNumber(reading.humidity),
                  lastReading: reading.recorded_at ? new Date(reading.recorded_at) : new Date(),
                  isLive: nextStatus !== 'hors ligne',
                  hasReading: true,
                };
              })()
            : sensor
        )
      );
    };

    socket.on('sensor_update', handleSensorUpdate);

    return () => {
      socket.off('sensor_update', handleSensorUpdate);
    };
  }, [socket]);

  const createSensor = async (
    name: string,
    location: string,
    sensorType: 'real' | 'simulation',
    options?: { sensorModel?: string; connectionMethod?: string }
  ) => {
    if (!hasAccessToken()) return null;

    try {
      const data = await apiClient.createSensor(name, location, sensorType, options);
      await fetchSensors();
      emitSensorsRefresh();
      return data;
    } catch (err: any) {
      console.error('Error creating sensor:', err);
      throw new Error(err.response?.data?.error || 'Impossible de créer le capteur');
    }
  };

  const updateSensor = async (
    sensorId: string,
    updates: {
      name?: string;
      location?: string;
      sensor_type?: 'real' | 'simulation';
      sensor_model?: string;
      connection_method?: string;
    }
  ) => {
    try {
      await apiClient.updateSensor(sensorId, updates);
      await fetchSensors();
      emitSensorsRefresh();
    } catch (err: any) {
      console.error('Error updating sensor:', err);
      throw new Error(err.response?.data?.error || 'Impossible de mettre à jour le capteur');
    }
  };

  const deleteSensor = async (sensorId: string) => {
    try {
      await apiClient.deleteSensor(sensorId);
      setSensors((prev) => prev.filter((s) => s.id !== sensorId));
      emitSensorsRefresh();
    } catch (err: any) {
      console.error('Error deleting sensor:', err);
      throw new Error(err.response?.data?.error || 'Impossible de supprimer le capteur');
    }
  };

  const addReading = async (
    sensorId: string,
    reading: { co2: number; temperature: number; humidity: number }
  ) => {
    try {
      await apiClient.addReading(sensorId, reading);
      await fetchSensors();
      emitSensorsRefresh();
    } catch (err: any) {
      console.error('Error adding reading:', err);
      throw new Error(err.response?.data?.error || 'Impossible d\'ajouter la mesure');
    }
  };

  return {
    sensors,
    isLoading,
    error,
    fetchSensors,
    createSensor,
    updateSensor,
    deleteSensor,
    addReading,
  };
};

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from './useAuth';
import { Sensor } from '@/lib/sensorData';
import { useWebSocket } from '@/contexts/WebSocketContext';

export const useSensors = () => {
  const { user } = useAuth();
  const { socket } = useWebSocket();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSensors = useCallback(async () => {
    if (!user) {
      setSensors([]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiClient.getSensors();
      
      const mappedSensors: Sensor[] = data.map((s: any) => ({
        id: s.id,
        name: s.name,
        location: s.location,
        status: s.status as 'en ligne' | 'hors ligne' | 'avertissement',
        co2: s.co2 || 0,
        temperature: s.temperature || 0,
        humidity: s.humidity || 0,
        lastReading: s.lastReading ? new Date(s.lastReading) : new Date(s.updated_at),
        battery: s.battery ?? undefined,
        isLive: s.is_live ?? true,
        thresholds: s.thresholds ?? undefined,
      }));

      setSensors(mappedSensors);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching sensors:', err);
      setError(err.response?.data?.error || 'Erreur lors du chargement des capteurs');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);

  // Setup WebSocket listener for sensor updates
  useEffect(() => {
    if (!socket || !user) return;

    const handleSensorUpdate = (data: any) => {
      const { sensor_id, reading } = data;
      const normalizedSensorId = Number(sensor_id);

      setSensors((prev) =>
        prev.map((sensor) =>
          sensor.id === normalizedSensorId
            ? {
                ...sensor,
                co2: Number(reading.co2),
                temperature: Number(reading.temperature),
                humidity: Number(reading.humidity),
                lastReading: new Date(reading.recorded_at),
              }
            : sensor
        )
      );
    };

    socket.on('sensor_update', handleSensorUpdate);

    return () => {
      socket.off('sensor_update', handleSensorUpdate);
    };
  }, [socket, user]);

  const createSensor = async (
    name: string,
    location: string,
    sensorType: 'real' | 'simulation'
  ) => {
    if (!user) return null;

    try {
      const data = await apiClient.createSensor(name, location, sensorType);
      await fetchSensors();
      return data;
    } catch (err: any) {
      console.error('Error creating sensor:', err);
      throw new Error(err.response?.data?.error || 'Failed to create sensor');
    }
  };

  const updateSensor = async (
    sensorId: string,
    updates: { name?: string; location?: string; sensor_type?: 'real' | 'simulation' }
  ) => {
    try {
      await apiClient.updateSensor(sensorId, updates);
      await fetchSensors();
    } catch (err: any) {
      console.error('Error updating sensor:', err);
      throw new Error(err.response?.data?.error || 'Failed to update sensor');
    }
  };

  const deleteSensor = async (sensorId: string) => {
    try {
      await apiClient.deleteSensor(sensorId);
      setSensors((prev) => prev.filter((s) => s.id !== sensorId));
    } catch (err: any) {
      console.error('Error deleting sensor:', err);
      throw new Error(err.response?.data?.error || 'Failed to delete sensor');
    }
  };

  const addReading = async (
    sensorId: string,
    reading: { co2: number; temperature: number; humidity: number }
  ) => {
    try {
      await apiClient.addReading(sensorId, reading);
      await fetchSensors();
    } catch (err: any) {
      console.error('Error adding reading:', err);
      throw new Error(err.response?.data?.error || 'Failed to add reading');
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

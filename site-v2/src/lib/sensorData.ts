// Aerium Sensor Data Simulation & Types

export interface Sensor {
  id: string;
  name: string;
  location: string;
  status: 'en ligne' | 'hors ligne' | 'avertissement';
  co2: number;
  temperature: number;
  humidity: number;
  lastReading: Date;
  battery?: number;
  isLive?: boolean;
}

export interface Reading {
  timestamp: Date;
  co2: number;
  temperature: number;
  humidity: number;
}

export interface Alert {
  id: string;
  sensorId: string;
  sensorName: string;
  type: 'avertissement' | 'critique' | 'info';
  message: string;
  value: number;
  timestamp: Date;
  status: 'nouvelle' | 'reconnue' | 'résolue';
}

export type AirQualityLevel = 'excellente' | 'bonne' | 'modérée' | 'médiocre' | 'dangereuse';

export function getAirQualityLevel(co2: number): AirQualityLevel {
  if (co2 < 400) return 'excellente';
  if (co2 < 800) return 'bonne';
  if (co2 < 1000) return 'modérée';
  if (co2 < 1500) return 'médiocre';
  return 'dangereuse';
}

export function getAirQualityColor(level: AirQualityLevel): string {
  switch (level) {
    case 'excellente': return 'text-success';
    case 'bonne': return 'text-primary';
    case 'modérée': return 'text-warning';
    case 'médiocre': return 'text-destructive';
    case 'dangereuse': return 'text-destructive';
  }
}

export function getHealthScore(co2: number, temp: number, humidity: number): number {
  let score = 100;
  
  // CO2 impact (biggest factor)
  if (co2 > 400) score -= Math.min(40, (co2 - 400) / 30);
  
  // Temperature impact (optimal 20-24°C)
  if (temp < 18 || temp > 26) score -= 15;
  else if (temp < 20 || temp > 24) score -= 5;
  
  // Humidity impact (optimal 40-60%)
  if (humidity < 30 || humidity > 70) score -= 15;
  else if (humidity < 40 || humidity > 60) score -= 5;
  
  return Math.max(0, Math.round(score));
}

// Generate realistic CO2 patterns (higher during work hours)
function generateCO2Pattern(hour: number, baseValue: number): number {
  const patterns: Record<number, number> = {
    0: -200, 1: -220, 2: -230, 3: -240, 4: -230, 5: -200,
    6: -150, 7: -50, 8: 50, 9: 150, 10: 200, 11: 250,
    12: 200, 13: 250, 14: 300, 15: 280, 16: 250, 17: 150,
    18: 50, 19: -50, 20: -100, 21: -150, 22: -180, 23: -190
  };
  
  const variation = (Math.random() - 0.5) * 100;
  return Math.max(350, baseValue + (patterns[hour] || 0) + variation);
}

export function generateMockSensors(): Sensor[] {
  return [
    {
      id: 'sensor-1',
      name: 'Bureau Principal',
      location: 'Bâtiment A, 2ᵉ étage',
      status: 'en ligne',
      co2: 792,
      temperature: 23.9,
      humidity: 44,
      lastReading: new Date(),
      battery: 85,
      isLive: true
    },
    {
      id: 'sensor-2',
      name: 'Salle de réunion Alpha',
      location: 'Bâtiment A, 1ᵉʳ étage',
      status: 'en ligne',
      co2: 825,
      temperature: 24.9,
      humidity: 59,
      lastReading: new Date(),
      battery: 72,
      isLive: true
    },
    {
      id: 'sensor-3',
      name: 'Salle des serveurs',
      location: 'Bâtiment A, sous-sol',
      status: 'avertissement',
      co2: 944,
      temperature: 26.1,
      humidity: 69,
      lastReading: new Date(),
      battery: 45,
      isLive: true
    }
  ];
}

export function generate24HourData(baseValue: number = 700): Reading[] {
  const data: Reading[] = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = timestamp.getHours();
    
    data.push({
      timestamp,
      co2: Math.round(generateCO2Pattern(hour, baseValue)),
      temperature: 22 + Math.random() * 4,
      humidity: 40 + Math.random() * 30
    });
  }
  
  return data;
}

export function generateMockAlerts(): Alert[] {
  return [
    {
      id: 'alert-1',
      sensorId: 'sensor-3',
      sensorName: 'Salle Serveur',
      type: 'avertissement',
      message: 'Niveau élevé de CO₂ détecté',
      value: 778,
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      status: 'nouvelle'
    },
    {
      id: 'alert-2',
      sensorId: 'sensor-3',
      sensorName: 'Salle Serveur',
      type: 'avertissement',
      message: 'Niveau élevé de CO₂ détecté',
      value: 746,
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: 'reconnue'
    }
  ];
}

// Simulate real-time updates
export function simulateSensorUpdate(sensor: Sensor): Sensor {
  const variation = (Math.random() - 0.5) * 30;
  const tempVariation = (Math.random() - 0.5) * 0.5;
  const humidityVariation = (Math.random() - 0.5) * 2;
  
  return {
    ...sensor,
    co2: Math.max(350, Math.round(sensor.co2 + variation)),
    temperature: Math.round((sensor.temperature + tempVariation) * 10) / 10,
    humidity: Math.max(20, Math.min(80, Math.round(sensor.humidity + humidityVariation))),
    lastReading: new Date()
  };
}

// Aerium Sensor Data Simulation & Types

export interface Sensor {
  id: string;
  name: string;
  location: string;
  status: "en ligne" | "hors ligne" | "avertissement";
  co2: number;
  temperature: number;
  humidity: number;
  lastReading: Date | null;
  battery?: number;
  isLive?: boolean;
  sensorType?: "real" | "simulation";
  hasReading?: boolean;
  sensorModel?: string;
  connectionMethod?: string;
  thresholds?: {
    co2?: number | null;
    temp_min?: number | null;
    temp_max?: number | null;
    humidity?: number | null;
  };
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
  type: "avertissement" | "critique" | "info";
  message: string;
  value: number;
  timestamp: Date;
  status: "nouvelle" | "reconnue" | "résolue";
}

export type AirQualityLevel =
  | "excellente"
  | "bonne"
  | "modérée"
  | "médiocre"
  | "dangereuse";

export function getAirQualityLevel(co2: number): AirQualityLevel {
  if (co2 < 400) return "excellente";
  if (co2 < 800) return "bonne";
  if (co2 < 1000) return "modérée";
  if (co2 < 1500) return "médiocre";
  return "dangereuse";
}

export function getAirQualityColor(level: AirQualityLevel): string {
  switch (level) {
    case "excellente":
      return "text-success";
    case "bonne":
      return "text-primary";
    case "modérée":
      return "text-warning";
    case "médiocre":
      return "text-destructive";
    case "dangereuse":
      return "text-destructive";
  }
}

export function getHealthScore(
  co2: number,
  temp: number,
  humidity: number,
): number {
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  // CO2 score with piecewise linear degradation based on IAQ thresholds.
  const co2Score = (() => {
    if (co2 <= 600) return 100;
    if (co2 <= 800) return 100 - ((co2 - 600) / 200) * 20;
    if (co2 <= 1000) return 80 - ((co2 - 800) / 200) * 20;
    if (co2 <= 1500) return 60 - ((co2 - 1000) / 500) * 30;
    if (co2 <= 2500) return 30 - ((co2 - 1500) / 1000) * 30;
    return 0;
  })();

  // Optimal around 22C; no penalty within +/-2C, then linear degradation.
  const tempDeviation = Math.max(0, Math.abs(temp - 22) - 2);
  const tempScore = 100 - tempDeviation * 8;

  // Optimal around 50%; no penalty within 40-60, then linear degradation.
  const humidityDeviation = Math.max(0, Math.abs(humidity - 50) - 10);
  const humidityScore = 100 - humidityDeviation * 2.5;

  const weighted = co2Score * 0.5 + tempScore * 0.25 + humidityScore * 0.25;
  return Math.round(clamp(weighted, 0, 100));
}

// Generate realistic CO2 patterns (higher during work hours)
function generateCO2Pattern(hour: number, baseValue: number): number {
  const patterns: Record<number, number> = {
    0: -200,
    1: -220,
    2: -230,
    3: -240,
    4: -230,
    5: -200,
    6: -150,
    7: -50,
    8: 50,
    9: 150,
    10: 200,
    11: 250,
    12: 200,
    13: 250,
    14: 300,
    15: 280,
    16: 250,
    17: 150,
    18: 50,
    19: -50,
    20: -100,
    21: -150,
    22: -180,
    23: -190,
  };

  const variation = (Math.random() - 0.5) * 100;
  return Math.max(350, baseValue + (patterns[hour] || 0) + variation);
}

export function generateMockSensors(): Sensor[] {
  return [
    {
      id: "sensor-1",
      name: "Bureau Principal",
      location: "Bâtiment A, 2ᵉ étage",
      status: "en ligne",
      co2: 792,
      temperature: 23.9,
      humidity: 44,
      lastReading: new Date(),
      isLive: true,
    },
    {
      id: "sensor-2",
      name: "Salle de réunion Alpha",
      location: "Bâtiment A, 1ᵉʳ étage",
      status: "en ligne",
      co2: 825,
      temperature: 24.9,
      humidity: 59,
      lastReading: new Date(),
      isLive: true,
    },
    {
      id: "sensor-3",
      name: "Salle des serveurs",
      location: "Bâtiment A, sous-sol",
      status: "avertissement",
      co2: 944,
      temperature: 26.1,
      humidity: 69,
      lastReading: new Date(),
      isLive: true,
    },
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
      humidity: 40 + Math.random() * 30,
    });
  }

  return data;
}

export function generateMockAlerts(): Alert[] {
  return [
    {
      id: "alert-1",
      sensorId: "sensor-3",
      sensorName: "Salle Serveur",
      type: "avertissement",
      message: "Niveau élevé de CO₂ détecté",
      value: 778,
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      status: "nouvelle",
    },
    {
      id: "alert-2",
      sensorId: "sensor-3",
      sensorName: "Salle Serveur",
      type: "avertissement",
      message: "Niveau élevé de CO₂ détecté",
      value: 746,
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: "reconnue",
    },
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
    humidity: Math.max(
      20,
      Math.min(80, Math.round(sensor.humidity + humidityVariation)),
    ),
    lastReading: new Date(),
  };
}

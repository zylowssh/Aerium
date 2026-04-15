export type RealConnectionMethod =
  | "http_push"
  | "mqtt_bridge"
  | "serial_gateway"
  | "websocket_gateway";

export interface RealSensorModelOption {
  value: string;
  label: string;
  description: string;
  recommended?: boolean;
}

export interface RealConnectionMethodOption {
  value: RealConnectionMethod;
  label: string;
  description: string;
}

export const DEFAULT_REAL_SENSOR_MODEL = "mq-135";
export const DEFAULT_REAL_CONNECTION_METHOD: RealConnectionMethod = "http_push";

export const REAL_SENSOR_MODEL_OPTIONS: RealSensorModelOption[] = [
  {
    value: "mq-135",
    label: "MQ-135",
    description: "Capteur gaz/qualite d'air populaire (analogique)",
    recommended: true,
  },
  {
    value: "sdc30",
    label: "SCD30 / SDC30",
    description: "CO2 NDIR haute precision",
  },
  {
    value: "scd41",
    label: "SCD41",
    description: "CO2 NDIR compact basse consommation",
  },
  {
    value: "mh-z19b",
    label: "MH-Z19B",
    description: "CO2 NDIR serie/UART",
  },
  {
    value: "bme680",
    label: "BME680",
    description: "Temperature/humidite/VOC (qualite d'air)",
  },
  {
    value: "generic",
    label: "Generique",
    description: "Modele reel non specifie",
  },
  {
    value: "custom",
    label: "Autre modele",
    description: "Saisir un modele personnalise",
  },
];

export const REAL_CONNECTION_METHOD_OPTIONS: RealConnectionMethodOption[] = [
  {
    value: "http_push",
    label: "HTTP API (recommande)",
    description: "Le microcontroleur envoie les mesures par POST HTTPS",
  },
  {
    value: "mqtt_bridge",
    label: "MQTT via passerelle",
    description: "Un bridge MQTT convertit les messages en appels API",
  },
  {
    value: "serial_gateway",
    label: "Serie USB via passerelle",
    description: "Un agent local lit le port serie et pousse vers l'API",
  },
  {
    value: "websocket_gateway",
    label: "WebSocket via passerelle",
    description: "Une passerelle recoit en WebSocket et pousse vers l'API",
  },
];

const SENSOR_MODEL_LABELS: Record<string, string> =
  REAL_SENSOR_MODEL_OPTIONS.reduce(
    (acc, item) => {
      acc[item.value] = item.label;
      return acc;
    },
    {} as Record<string, string>,
  );

const CONNECTION_METHOD_LABELS: Record<RealConnectionMethod, string> = {
  http_push: "HTTP API (recommande)",
  mqtt_bridge: "MQTT via passerelle",
  serial_gateway: "Serie USB via passerelle",
  websocket_gateway: "WebSocket via passerelle",
};

const CONNECTION_METHOD_DESCRIPTIONS: Record<RealConnectionMethod, string> = {
  http_push:
    "Connexion directe la plus simple: POST vers l'endpoint d'ingestion.",
  mqtt_bridge:
    "Publiez sur votre broker MQTT; une passerelle relaie ensuite vers Aerium.",
  serial_gateway:
    "L'agent local lit les trames serie puis envoie les mesures en HTTP.",
  websocket_gateway:
    "La passerelle recoit en WebSocket puis transfere vers l'endpoint HTTP Aerium.",
};

export function getSensorModelLabel(sensorModel?: string | null): string {
  if (!sensorModel) {
    return "Modele non defini";
  }

  const key = sensorModel.toLowerCase();
  return SENSOR_MODEL_LABELS[key] || sensorModel;
}

export function getConnectionMethodLabel(method?: string | null): string {
  if (!method) {
    return CONNECTION_METHOD_LABELS.http_push;
  }

  const key = method.toLowerCase() as RealConnectionMethod;
  return CONNECTION_METHOD_LABELS[key] || method;
}

export function getConnectionMethodDescription(method?: string | null): string {
  if (!method) {
    return CONNECTION_METHOD_DESCRIPTIONS.http_push;
  }

  const key = method.toLowerCase() as RealConnectionMethod;
  return (
    CONNECTION_METHOD_DESCRIPTIONS[key] ||
    CONNECTION_METHOD_DESCRIPTIONS.http_push
  );
}

export function getConnectionMethodSteps(method?: string | null): string[] {
  const key = (method || "http_push").toLowerCase() as RealConnectionMethod;

  switch (key) {
    case "mqtt_bridge":
      return [
        "Connectez le capteur au broker MQTT (Wi-Fi/Ethernet).",
        "Publiez les mesures (co2, temperature, humidity) sur un topic dedie.",
        "Configurez une passerelle pour convertir le topic MQTT en POST vers Aerium.",
      ];
    case "serial_gateway":
      return [
        "Branchez le capteur sur un port serie (USB/UART) de la passerelle locale.",
        "Demarrez un agent local qui parse les trames du capteur.",
        "Faites poster chaque mesure parsee vers l'endpoint d'ingestion Aerium.",
      ];
    case "websocket_gateway":
      return [
        "Connectez le capteur (ou firmware) a votre serveur passerelle WebSocket.",
        "Normalisez les messages recus en JSON co2/temperature/humidity.",
        "Relayer chaque message en POST vers l'endpoint Aerium avec X-API-Key.",
      ];
    case "http_push":
    default:
      return [
        "Connectez votre capteur (ESP32/RPi/etc.) au reseau.",
        "Envoyez regulierement un POST JSON vers l'endpoint d'ingestion Aerium.",
        "Ajoutez l'en-tete X-API-Key configuree cote backend.",
      ];
  }
}

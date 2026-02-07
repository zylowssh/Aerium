/**
 * Zod validation schemas for form inputs and API requests
 */
import { z } from 'zod';

// Sensor validation
export const sensorSchema = z.object({
  name: z.string()
    .min(1, 'Le nom du capteur est requis')
    .max(255, 'Le nom ne peut pas dépasser 255 caractères'),
  location: z.string()
    .min(1, 'La localisation est requise')
    .max(500, 'La localisation ne peut pas dépasser 500 caractères'),
  sensorType: z.enum(['real', 'simulation'], {
    errorMap: () => ({ message: 'Type de capteur invalide' })
  })
});

export type SensorInput = z.infer<typeof sensorSchema>;

// Sensor reading validation
export const readingSchema = z.object({
  sensor_id: z.number().int().positive('ID du capteur invalide'),
  co2: z.number()
    .min(0, 'Le niveau de CO₂ ne peut pas être négatif')
    .max(5000, 'Le niveau de CO₂ ne peut pas dépasser 5000 ppm'),
  temperature: z.number()
    .min(-50, 'La température ne peut pas être inférieure à -50°C')
    .max(100, 'La température ne peut pas dépasser 100°C'),
  humidity: z.number()
    .min(0, "L'humidité ne peut pas être négative")
    .max(100, "L'humidité ne peut pas dépasser 100%")
});

export type ReadingInput = z.infer<typeof readingSchema>;

// Threshold validation
export const thresholdSchema = z.object({
  co2: z.number()
    .min(400, 'Le seuil de CO₂ doit être au moins 400 ppm')
    .max(5000, 'Le seuil de CO₂ ne peut pas dépasser 5000 ppm')
    .nullable()
    .optional(),
  temp_min: z.number()
    .min(-50, 'La température minimale ne peut pas être inférieure à -50°C')
    .max(50, 'La température minimale ne peut pas dépasser 50°C')
    .nullable()
    .optional(),
  temp_max: z.number()
    .min(-50, 'La température maximale ne peut pas être inférieure à -50°C')
    .max(100, 'La température maximale ne peut pas dépasser 100°C')
    .nullable()
    .optional(),
  humidity: z.number()
    .min(20, "Le seuil d'humidité doit être au moins 20%")
    .max(100, "Le seuil d'humidité ne peut pas dépasser 100%")
    .nullable()
    .optional()
}).refine(
  (data) => {
    if (data.temp_min !== null && data.temp_max !== null && 
        data.temp_min !== undefined && data.temp_max !== undefined) {
      return data.temp_min < data.temp_max;
    }
    return true;
  },
  {
    message: 'La température minimale doit être inférieure à la température maximale',
    path: ['temp_max']
  }
);

export type ThresholdInput = z.infer<typeof thresholdSchema>;

// User registration validation
export const registerSchema = z.object({
  email: z.string()
    .email('Adresse email invalide')
    .min(1, "L'email est requis"),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(255, 'Le mot de passe est trop long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
    ),
  fullName: z.string()
    .min(1, 'Le nom complet est requis')
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Login validation
export const loginSchema = z.object({
  email: z.string()
    .email('Adresse email invalide')
    .min(1, "L'email est requis"),
  password: z.string()
    .min(1, 'Le mot de passe est requis')
});

export type LoginInput = z.infer<typeof loginSchema>;

// Simulation speed validation
export const simulationSpeedSchema = z.object({
  speed: z.number()
    .min(0.1, 'La vitesse doit être au moins 0.1 seconde')
    .max(60, 'La vitesse ne peut pas dépasser 60 secondes')
});

export type SimulationSpeedInput = z.infer<typeof simulationSpeedSchema>;

/**
 * Helper function to validate data against a Zod schema
 * Returns formatted error messages if validation fails
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return { success: false, errors };
}

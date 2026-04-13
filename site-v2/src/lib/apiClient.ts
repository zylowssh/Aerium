import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL } from '@/lib/apiBaseUrl';

interface ApiError {
  error: string;
}

interface PredictiveAlertCard {
  id: string;
  sensorName: string;
  metric: string;
  title: string;
  description: string;
  likelihood: number;
  timeframe: string;
  impact: 'low' | 'medium' | 'high';
  currentValue: number;
  trendPercentage: number;
}

interface AIForecastPoint {
  hour: string;
  co2: number;
  co2_lower?: number;
  co2_upper?: number;
  temperature?: number;
  humidity?: number;
}

interface PredictiveAlertsData {
  cards: PredictiveAlertCard[];
  forecast: AIForecastPoint[];
  trends: Record<string, any>;
}

class ApiClient {
  private client: AxiosInstance;

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private toFiniteNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private toImpact(level: string): 'low' | 'medium' | 'high' {
    if (level === 'high') return 'high';
    if (level === 'moderate' || level === 'medium') return 'medium';
    return 'low';
  }

  private mapCo2RiskToLikelihood(riskLevel: string, peakCo2: number): number {
    if (riskLevel === 'high') {
      return this.clamp(Math.round(80 + Math.max(0, peakCo2 - 1000) / 20), 80, 96);
    }
    if (riskLevel === 'moderate') {
      return this.clamp(Math.round(60 + Math.max(0, peakCo2 - 800) / 20), 60, 82);
    }
    return this.clamp(Math.round(28 + Math.max(0, peakCo2 - 600) / 30), 20, 60);
  }

  private mapAIPredictionsToAlertCards(data: any): PredictiveAlertCard[] {
    const forecast = Array.isArray(data?.forecast) ? data.forecast : [];
    if (forecast.length === 0) {
      return [];
    }

    const trends = data?.trends ?? {};
    const token = String(data?.generated_at ?? Date.now());

    const avg = (values: number[]) =>
      values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

    const co2Series = forecast
      .map((point: any) => this.toFiniteNumber(point?.co2, NaN))
      .filter((value: number): value is number => Number.isFinite(value));
    const tempSeries = forecast
      .map((point: any) => this.toFiniteNumber(point?.temperature, NaN))
      .filter((value: number): value is number => Number.isFinite(value));
    const humiditySeries = forecast
      .map((point: any) => this.toFiniteNumber(point?.humidity, NaN))
      .filter((value: number): value is number => Number.isFinite(value));

    if (co2Series.length === 0) {
      return [];
    }

    const cards: PredictiveAlertCard[] = [];

    const co2Current = this.toFiniteNumber(trends.current_avg_co2, co2Series[0] ?? avg(co2Series));
    const co2Peak = this.toFiniteNumber(trends.peak_co2, Math.max(...co2Series));
    const co2Change = this.toFiniteNumber(
      trends.co2_change_pct,
      ((co2Series[co2Series.length - 1] - co2Series[0]) / Math.max(co2Series[0], 1)) * 100
    );
    const riskLevel = String(trends.risk_level ?? '').toLowerCase();
    const co2Impact = this.toImpact(riskLevel);

    cards.push({
      id: `ai-co2-${token}`,
      sensorName: 'Systeme (agrege)',
      metric: 'co2',
      title: `Risque CO2 ${co2Impact === 'high' ? 'eleve' : co2Impact === 'medium' ? 'modere' : 'faible'}`,
      description: `Pic prevu ${Math.round(co2Peak)} ppm${trends.peak_hour ? ` vers ${trends.peak_hour}` : ''}.`,
      likelihood: this.mapCo2RiskToLikelihood(riskLevel, co2Peak),
      timeframe: 'Prochaines 24h',
      impact: co2Impact,
      currentValue: Math.round(co2Current),
      trendPercentage: Math.round(co2Change * 10) / 10,
    });

    if (tempSeries.length > 0) {
      const tempCurrent = avg(tempSeries);
      const tempMax = Math.max(...tempSeries);
      const tempMin = Math.min(...tempSeries);
      const tempDeviation = Math.max(tempMax - 24, 20 - tempMin, 0);
      const tempImpact: 'low' | 'medium' | 'high' =
        tempDeviation >= 4 ? 'high' : tempDeviation >= 2 ? 'medium' : 'low';
      const tempTrend =
        ((tempSeries[tempSeries.length - 1] - tempSeries[0]) / Math.max(Math.abs(tempSeries[0]), 1)) * 100;

      cards.push({
        id: `ai-temperature-${token}`,
        sensorName: 'Systeme (agrege)',
        metric: 'temperature',
        title: tempImpact === 'high' ? 'Confort thermique degrade' : 'Stabilite thermique',
        description: `Plage prevue ${tempMin.toFixed(1)}-${tempMax.toFixed(1)}C (cible 20-24C).`,
        likelihood: this.clamp(Math.round(25 + tempDeviation * 18), 25, 92),
        timeframe: 'Prochaines 24h',
        impact: tempImpact,
        currentValue: Math.round(tempCurrent * 10) / 10,
        trendPercentage: Math.round(tempTrend * 10) / 10,
      });
    }

    if (humiditySeries.length > 0) {
      const humidityCurrent = avg(humiditySeries);
      const humidityMax = Math.max(...humiditySeries);
      const humidityMin = Math.min(...humiditySeries);
      const humidityDeviation = Math.max(humidityMax - 60, 40 - humidityMin, 0);
      const humidityImpact: 'low' | 'medium' | 'high' =
        humidityDeviation >= 15 ? 'high' : humidityDeviation >= 7 ? 'medium' : 'low';
      const humidityTrend =
        ((humiditySeries[humiditySeries.length - 1] - humiditySeries[0]) /
          Math.max(Math.abs(humiditySeries[0]), 1)) *
        100;

      cards.push({
        id: `ai-humidity-${token}`,
        sensorName: 'Systeme (agrege)',
        metric: 'humidity',
        title: humidityImpact === 'high' ? 'Humidite hors plage' : 'Humidite sous controle',
        description: `Plage prevue ${Math.round(humidityMin)}-${Math.round(humidityMax)}% (cible 40-60%).`,
        likelihood: this.clamp(Math.round(20 + humidityDeviation * 4), 20, 92),
        timeframe: 'Prochaines 24h',
        impact: humidityImpact,
        currentValue: Math.round(humidityCurrent),
        trendPercentage: Math.round(humidityTrend * 10) / 10,
      });
    }

    return cards.sort((a, b) => b.likelihood - a.likelihood);
  }

  async getPredictiveAlertsData(): Promise<PredictiveAlertsData> {
    const response = await this.client.get('/ai/predictions');
    const payload = response.data ?? {};
    return {
      cards: this.mapAIPredictionsToAlertCards(payload),
      forecast: Array.isArray(payload.forecast) ? payload.forecast : [],
      trends: payload.trends && typeof payload.trends === 'object' ? payload.trends : {},
    };
  }

  constructor() {
    console.log('ApiClient initialized with base URL:', API_BASE_URL);
    
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: false, // Changed to false for mobile - using localStorage, not cookies
      timeout: 10000, // 10 second timeout
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
      },
      async (error: AxiosError<ApiError>) => {
        console.error('API Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data
        });
        
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                headers: { Authorization: `Bearer ${refreshToken}` }
              });
              const { access_token } = response.data;
              localStorage.setItem('access_token', access_token);
              
              // Retry original request
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${access_token}`;
                return axios.request(error.config);
              }
            } catch (refreshError) {
              // Refresh failed, clear tokens and redirect to login
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              window.location.href = '/auth';
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async register(email: string, password: string, fullName: string) {
    const response = await this.client.post('/auth/register', { email, password, fullName });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    const { access_token, refresh_token, user } = response.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    return { user };
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data.user;
  }

  // Sensor methods
  async getSensors() {
    const response = await this.client.get('/sensors');
    return Array.isArray(response.data?.sensors) ? response.data.sensors : [];
  }

  async getSensor(sensorId: string) {
    const response = await this.client.get(`/sensors/${sensorId}`);
    return response.data.sensor;
  }

  async createSensor(name: string, location: string, sensorType: 'real' | 'simulation' = 'simulation') {
    const response = await this.client.post('/sensors', { name, location, sensor_type: sensorType });
    return response.data.sensor;
  }

  async updateSensor(sensorId: string, updates: { name?: string; location?: string; sensor_type?: string }) {
    const response = await this.client.put(`/sensors/${sensorId}`, updates);
    return response.data.sensor;
  }

  async updateSensorThresholds(sensorId: string, thresholds: { co2?: number | null; temp_min?: number | null; temp_max?: number | null; humidity?: number | null }) {
    const response = await this.client.put(`/sensors/${sensorId}/thresholds`, thresholds);
    return response.data;
  }

  async deleteSensor(sensorId: string) {
    const response = await this.client.delete(`/sensors/${sensorId}`);
    return response.data;
  }

  // Reading methods
  async getSensorReadings(sensorId: string, hours: number = 24, limit: number = 100) {
    const response = await this.client.get(`/readings/sensor/${sensorId}`, {
      params: { hours, limit }
    });
    return Array.isArray(response.data?.readings) ? response.data.readings : [];
  }

  async addReading(sensorId: string, reading: { co2: number; temperature: number; humidity: number }) {
    const response = await this.client.post('/readings', { sensor_id: sensorId, ...reading });
    return response.data.reading;
  }

  async getAggregateData() {
    const response = await this.client.get('/readings/aggregate');
    return {
      avgCo2: Number(response.data?.avgCo2 ?? 0),
      avgTemperature: Number(response.data?.avgTemperature ?? 0),
      avgHumidity: Number(response.data?.avgHumidity ?? 0),
      totalReadings: Number(response.data?.totalReadings ?? 0),
    };
  }

  // User methods
  async getProfile() {
    const response = await this.client.get('/users/profile');
    return response.data.user;
  }

  async updateProfile(updates: { full_name?: string; avatar_url?: string }) {
    const response = await this.client.put('/users/profile', updates);
    return response.data.user;
  }

  async changePassword(oldPassword: string, newPassword: string) {
    const response = await this.client.post('/users/change-password', {
      old_password: oldPassword,
      new_password: newPassword
    });
    return response.data;
  }

  async getAllUsers() {
    const response = await this.client.get('/users');
    return response.data.users;
  }

  // Alert methods
  async getPredictions() {
    const data = await this.getPredictiveAlertsData();
    return data.cards;
  }

  async getAlertHistory(days?: number, limit?: number) {
    const params = new URLSearchParams();
    if (days) params.append('days', days.toString());
    if (limit) params.append('limit', limit.toString());
    
    const response = await this.client.get(`/alerts/history/list?${params.toString()}`);
    return response.data;
  }

  async getAlertStats(days?: number) {
    const params = new URLSearchParams();
    if (days) params.append('days', days.toString());
    
    const response = await this.client.get(`/alerts/history/stats?${params.toString()}`);
    return response.data;
  }

  // Maintenance methods
  async getMaintenance(status?: string, sensorId?: number, limit?: number) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (sensorId) params.append('sensor_id', sensorId.toString());
    if (limit) params.append('limit', limit.toString());
    
    const response = await this.client.get(`/maintenance?${params.toString()}`);
    return Array.isArray(response.data?.maintenance) ? response.data.maintenance : [];
  }

  async getMaintenanceTask(maintenanceId: number) {
    const response = await this.client.get(`/maintenance/${maintenanceId}`);
    return response.data.maintenance;
  }

  async createMaintenance(data: {
    sensorId: number;
    type: string;
    scheduledDate: string;
    status?: string;
    description?: string;
    notes?: string;
    priority?: string;
  }) {
    const response = await this.client.post('/maintenance', data);
    return response.data.maintenance;
  }

  async updateMaintenance(maintenanceId: number, data: Record<string, any>) {
    const response = await this.client.put(`/maintenance/${maintenanceId}`, data);
    return response.data.maintenance;
  }

  async deleteMaintenance(maintenanceId: number) {
    const response = await this.client.delete(`/maintenance/${maintenanceId}`);
    return response.data;
  }

  // Export methods
  async exportAlertsPDF(days?: number) {
    const response = await this.client.get('/reports/export/pdf', {
      responseType: 'blob',
      params: days ? { days } : {}
    });
    return response.data;
  }

  async exportAlertsCSV(days?: number) {
    const response = await this.client.get('/reports/export/csv', {
      responseType: 'blob',
      params: days ? { days } : {}
    });
    return response.data;
  }

  // Alert methods
  async getAlerts(status?: 'nouvelle' | 'reconnue' | 'résolue', limit?: number) {
    const response = await this.client.get('/alerts', {
      params: { status, limit }
    });
    return Array.isArray(response.data?.alerts) ? response.data.alerts : [];
  }

  async updateAlertStatus(alertId: string, status: 'nouvelle' | 'reconnue' | 'résolue') {
    const response = await this.client.put(`/alerts/${alertId}`, { status });
    return response.data.alert;
  }

  async deleteAlert(alertId: string) {
    const response = await this.client.delete(`/alerts/${alertId}`);
    return response.data;
  }

  // AI methods
  async getAIRecommendations() {
    const response = await this.client.post('/ai/recommendations');
    return response.data;
  }

  async getAIPredictions() {
    const response = await this.client.get('/ai/predictions');
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Generic methods for custom endpoints
  async get(endpoint: string, config?: Record<string, any>) {
    const response = await this.client.get(endpoint, config);
    return response;
  }

  async post(endpoint: string, data?: any, config?: Record<string, any>) {
    const response = await this.client.post(endpoint, data, config);
    return response;
  }

  async put(endpoint: string, data?: any, config?: Record<string, any>) {
    const response = await this.client.put(endpoint, data, config);
    return response;
  }

  async delete(endpoint: string, config?: Record<string, any>) {
    const response = await this.client.delete(endpoint, config);
    return response;
  }
}

export const apiClient = new ApiClient();
export default apiClient;

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiError {
  error: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
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
    return response.data.sensors;
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
    return response.data.readings;
  }

  async addReading(sensorId: string, reading: { co2: number; temperature: number; humidity: number }) {
    const response = await this.client.post('/readings', { sensor_id: sensorId, ...reading });
    return response.data.reading;
  }

  async getAggregateData() {
    const response = await this.client.get('/readings/aggregate');
    return response.data;
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
    const response = await this.client.get('/alerts/predictions');
    return response.data.predictions;
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
    return response.data.maintenance;
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
    return response.data.alerts;
  }

  async updateAlertStatus(alertId: string, status: 'nouvelle' | 'reconnue' | 'résolue') {
    const response = await this.client.put(`/alerts/${alertId}`, { status });
    return response.data.alert;
  }

  async deleteAlert(alertId: string) {
    const response = await this.client.delete(`/alerts/${alertId}`);
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

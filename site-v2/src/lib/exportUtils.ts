/**
 * Export utilities for generating CSV and other export formats
 */

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get column headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data: any[], filename: string) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Convert alerts data to format suitable for export
 */
export const formatAlertsForExport = (alerts: any[]) => {
  return alerts.map(alert => ({
    'Date/Heure': new Date(alert.createdAt).toLocaleString('fr-FR'),
    'Capteur': alert.sensorName,
    'Localisation': alert.sensorLocation,
    'Type d\'alerte': alert.alertType,
    'Métrique': alert.metric,
    'Valeur': alert.metricValue,
    'Seuil': alert.thresholdValue || '-',
    'Message': alert.message,
    'Statut': alert.status,
    'Accusée le': alert.acknowledgedAt ? new Date(alert.acknowledgedAt).toLocaleString('fr-FR') : '-',
    'Résolue le': alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString('fr-FR') : '-'
  }));
};

/**
 * Format readings data for export
 */
export const formatReadingsForExport = (readings: any[]) => {
  return readings.map(reading => ({
    'Date/Heure': new Date(reading.timestamp).toLocaleString('fr-FR'),
    'CO₂ (ppm)': reading.co2,
    'Température (°C)': reading.temperature,
    'Humidité (%)': reading.humidity
  }));
};

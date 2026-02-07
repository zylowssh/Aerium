import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { apiClient } from '@/lib/apiClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AlertStats {
  totalAlerts: number;
  triggered: number;
  acknowledged: number;
  resolved: number;
  byType: {
    [key: string]: number;
  };
  byMetric: {
    [key: string]: number;
  };
}

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

const Reports = () => {
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(30);

  useEffect(() => {
    fetchStats();
  }, [selectedDays]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAlertStats(selectedDays);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await apiClient.exportAlertsPDF(selectedDays);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport-alertes-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await apiClient.exportAlertsCSV(selectedDays);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `alertes-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Rapports" subtitle="Analyses et rapports sur les alertes">
        <div className="space-y-6">
          <LoadingSkeleton variant="stats" count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadingSkeleton variant="chart" />
            <LoadingSkeleton variant="chart" />
          </div>
          <LoadingSkeleton variant="chart" />
        </div>
      </AppLayout>
    );
  }

  if (!stats) {
    return (
      <AppLayout title="Rapports" subtitle="Analyses et rapports sur les alertes">
        <p className="text-muted-foreground">Erreur lors du chargement des données</p>
      </AppLayout>
    );
  }

  // Prepare data for charts
  const typeData = Object.entries(stats.byType).map(([key, value]) => ({
    name: key,
    value: value
  }));

  const metricData = Object.entries(stats.byMetric).map(([key, value]) => ({
    name: key,
    value: value
  }));

  const statusData = [
    { name: 'Déclenchées', value: stats.triggered },
    { name: 'Accusées', value: stats.acknowledged },
    { name: 'Résolues', value: stats.resolved }
  ];

  return (
    <AppLayout title="Rapports" subtitle="Analyses et rapports sur les alertes">
      <div className="space-y-6">
        {/* Export Buttons */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 justify-end"
        >
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </Button>
          <Button
            onClick={handleExportPDF}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter PDF
          </Button>
        </motion.div>

        {/* Period Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2"
        >
          {[7, 30, 90, 180].map((days) => (
            <Button
              key={days}
              variant={selectedDays === days ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDays(days)}
            >
              {days === 7 ? '7j' : days === 30 ? '30j' : days === 90 ? '90j' : '6m'}
            </Button>
          ))}
        </motion.div>

        {/* Key Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card className="p-6 bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <div className="text-sm text-muted-foreground mb-1">Total des Alertes</div>
            <div className="text-3xl font-bold text-foreground">{stats.totalAlerts}</div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <div className="text-sm text-muted-foreground mb-1">Déclenchées</div>
            <div className="text-3xl font-bold text-orange-500">{stats.triggered}</div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
            <div className="text-sm text-muted-foreground mb-1">Accusées</div>
            <div className="text-3xl font-bold text-yellow-500">{stats.acknowledged}</div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <div className="text-sm text-muted-foreground mb-1">Résolues</div>
            <div className="text-3xl font-bold text-green-500">{stats.resolved}</div>
          </Card>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alert Type Distribution */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Distribution par Type
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Metric Distribution */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Distribution par Métrique
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metricData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Status Distribution */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Distribution par Statut
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Résumé</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground">Taux de résolution</span>
                  <span className="font-semibold">
                    {stats.totalAlerts > 0 
                      ? ((stats.resolved / stats.totalAlerts) * 100).toFixed(1) 
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground">Alertes en attente</span>
                  <span className="font-semibold">{stats.triggered + stats.acknowledged}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground">Type dominant</span>
                  <span className="font-semibold">
                    {typeData.length > 0
                      ? typeData.reduce((prev, curr) =>
                          curr.value > prev.value ? curr : prev
                        ).name
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Métrique dominante</span>
                  <span className="font-semibold">
                    {metricData.length > 0
                      ? metricData.reduce((prev, curr) =>
                          curr.value > prev.value ? curr : prev
                        ).name
                      : '-'}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;

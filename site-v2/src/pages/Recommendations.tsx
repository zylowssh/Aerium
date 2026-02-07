import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Calendar, 
  ArrowRight, 
  Lightbulb,
  Leaf,
  Users,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { apiClient } from '@/lib/apiClient';

interface Recommendation {
  id: number;
  title: string;
  description: string;
  impact: 'élevé' | 'moyen' | 'faible';
  category: string;
  icon: any;
  savings: string;
}

const defaultRecommendations: Recommendation[] = [
  {
    id: 1,
    title: 'Améliorer la ventilation du Bureau',
    description: 'Les niveaux de CO₂ dépassent régulièrement 1000 ppm.',
    impact: 'élevé',
    category: 'ventilation',
    icon: Zap,
    savings: '15% de productivité',
  },
  {
    id: 2,
    title: 'Programmer l\'aération matinale',
    description: 'Ouvrir les fenêtres 30 minutes avant l\'arrivée des équipes.',
    impact: 'moyen',
    category: 'routine',
    icon: Clock,
    savings: '10% de confort',
  },
  {
    id: 3,
    title: 'Ajouter des plantes dépolluantes',
    description: 'Les plantes peuvent réduire les COV de 20%.',
    impact: 'moyen',
    category: 'environnement',
    icon: Leaf,
    savings: 'Amélioration qualité air',
  },
  {
    id: 4,
    title: 'Optimiser l\'occupation des salles',
    description: 'Répartir les réunions pour éviter la surpopulation.',
    impact: 'faible',
    category: 'organisation',
    icon: Users,
    savings: '5% de confort',
  },
];

const achievements = [
  { id: 1, title: 'Première Semaine Sans Alerte', icon: Award, unlocked: true, date: '15 Jan 2026' },
  { id: 2, title: 'Score Santé Excellence', icon: Target, unlocked: true, date: '20 Jan 2026' },
  { id: 3, title: '30 Jours Consécutifs', icon: Calendar, unlocked: false, progress: 22 },
  { id: 4, title: 'Zéro Émission Critique', icon: Leaf, unlocked: false, progress: 85 },
];

const Recommendations = () => {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([
    { label: 'Maintenir CO₂ < 800 ppm', current: 78, target: 90, unit: '%' },
    { label: 'Température optimale 20-24°C', current: 92, target: 95, unit: '%' },
    { label: 'Humidité 40-60%', current: 65, target: 80, unit: '%' },
    { label: 'Score santé > 85', current: 88, target: 90, unit: '/100' },
  ]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(defaultRecommendations);

  useEffect(() => {
    fetchRecommendationData();
  }, []);

  const fetchRecommendationData = async () => {
    try {
      setLoading(true);
      const readings = await apiClient.getAggregateData();
      const alerts = await apiClient.getAlerts(undefined, 100);
      
      // Calculate goals based on real data
      const avgCo2 = readings.avgCo2 || 800;
      const avgTemp = readings.avgTemperature || 22;
      const avgHumidity = readings.avgHumidity || 50;
      
      // Calculate percentages for goals
      const co2Percent = Math.max(0, Math.min(100, 100 - (avgCo2 - 400) / 6));
      const tempPercent = Math.max(0, Math.min(100, 100 - Math.abs(avgTemp - 22) * 10));
      const humidityPercent = Math.max(0, Math.min(100, 100 - Math.abs(avgHumidity - 50) * 2));
      
      setGoals([
        { label: 'Maintenir CO₂ < 800 ppm', current: Math.round(co2Percent), target: 90, unit: '%' },
        { label: 'Température optimale 20-24°C', current: Math.round(tempPercent), target: 95, unit: '%' },
        { label: 'Humidité 40-60%', current: Math.round(humidityPercent), target: 80, unit: '%' },
        { label: 'Score santé > 85', current: Math.min(90, Math.round((co2Percent + tempPercent + humidityPercent) / 3)), target: 90, unit: '/100' },
      ]);
      
      // Generate recommendations based on real alerts
      const newRecs: Recommendation[] = [];
      const criticalAlerts = alerts.filter((a: any) => a.type === 'critique');
      const warningAlerts = alerts.filter((a: any) => a.type === 'avertissement');
      
      if (avgCo2 > 1000) {
        newRecs.push({
          id: newRecs.length + 1,
          title: 'Améliorer la ventilation urgente',
          description: `CO₂ moyen: ${Math.round(avgCo2)} ppm - dépasse le seuil recommandé`,
          impact: 'élevé',
          category: 'ventilation',
          icon: Zap,
          savings: '20% de productivité'
        });
      }
      
      if (Math.abs(avgTemp - 22) > 3) {
        newRecs.push({
          id: newRecs.length + 1,
          title: 'Réguler la température',
          description: `Température moyenne: ${avgTemp.toFixed(1)}°C - optimale: 20-24°C`,
          impact: 'moyen',
          category: 'climat',
          icon: Thermometer,
          savings: '15% de confort'
        });
      }
      
      if (avgHumidity < 40 || avgHumidity > 60) {
        newRecs.push({
          id: newRecs.length + 1,
          title: 'Ajuster l\'humidité',
          description: `Humidité: ${Math.round(avgHumidity)}% - cible: 40-60%`,
          impact: 'moyen',
          category: 'climat',
          icon: Droplets,
          savings: '10% de santé'
        });
      }
      
      // Add default recommendations if not enough
      if (newRecs.length === 0) {
        setRecommendations(defaultRecommendations);
      } else {
        setRecommendations(newRecs.slice(0, 4));
      }
      
    } catch (error) {
      console.error('Error fetching recommendation data:', error);
      setRecommendations(defaultRecommendations);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'élevé': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'moyen': return 'bg-warning/10 text-warning border-warning/30';
      case 'faible': return 'bg-success/10 text-success border-success/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Import missing icons
  const Thermometer = Zap;
  const Droplets = Zap;

  return (
    <AppLayout title="Recommandations" subtitle="Optimisez votre qualité de l'air avec des conseils personnalisés">
      <div className="space-y-6">
        {loading ? (
          <>
            <LoadingSkeleton variant="kpi" count={4} />
            <LoadingSkeleton variant="card" count={2} />
          </>
        ) : (
          <>
            {/* Goals Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">{goal.label}</span>
                        <Target className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-2xl font-bold text-foreground">{goal.current}</span>
                        <span className="text-sm text-muted-foreground mb-1">/ {goal.target}{goal.unit}</span>
                      </div>
                      <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-warning" />
                    Recommandations Personnalisées
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <rec.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">{rec.title}</h4>
                          <Badge variant="outline" className={getImpactColor(rec.impact)}>
                            Impact {rec.impact}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                        <p className="text-xs text-success flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {rec.savings}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-warning" />
                    Succès et Objectifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={cn(
                          "p-4 rounded-lg border text-center transition-all",
                          achievement.unlocked
                            ? "bg-primary/5 border-primary/30"
                            : "bg-muted/30 border-border opacity-60"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center",
                          achievement.unlocked ? "bg-primary/20" : "bg-muted"
                        )}>
                          {achievement.unlocked ? (
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                          ) : (
                            <achievement.icon className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <h4 className="font-medium text-foreground mb-1">{achievement.title}</h4>
                        {achievement.unlocked ? (
                          <p className="text-xs text-success">{achievement.date}</p>
                        ) : (
                          <div className="mt-2">
                            <Progress value={achievement.progress} className="h-1" />
                            <p className="text-xs text-muted-foreground mt-1">{achievement.progress}%</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Recommendations;

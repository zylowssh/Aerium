import { motion } from 'framer-motion';
import { BarChart3, Bell, TrendingUp, Wind, Gauge, Lightbulb, Zap } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Dashboard Avancé',
    description: 'Visualisez les données en temps réel avec des graphiques interactifs et des analyses détaillées.'
  },
  {
    icon: Bell,
    title: "Système d'Alertes",
    description: 'Notifications intelligentes basées sur des seuils personnalisés pour chaque capteur.'
  },
  {
    icon: TrendingUp,
    title: 'Analyses Tendances',
    description: "Comparez les données historiques et identifiez les patterns de qualité de l'air."
  },
  {
    icon: Wind,
    title: 'Support Multi-Capteurs',
    description: 'Compatible avec une large gamme de capteurs IoT pour une flexibilité maximale.'
  },
  {
    icon: Gauge,
    title: 'Métriques Détaillées',
    description: 'Suivi complet de CO2, humidité, température et autres paramètres clés.'
  },
  {
    icon: Lightbulb,
    title: 'Recommandations',
    description: "Suggestions intelligentes pour améliorer la qualité de l'air de vos espaces."
  }
];

const fadeUpVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const FeaturesSection = () => {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Background decoration */}
      <motion.div
        className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20"
            variants={scaleInVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Zap className="w-4 h-4" />
            Caractéristiques Puissantes
          </motion.span>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Fonctionnalités
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Un ensemble complet d'outils pour une surveillance efficace de la qualité de l'air.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group relative"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="p-8 rounded-2xl glass-card border border-border/50 hover:border-primary/50 transition-all duration-300 h-full relative overflow-hidden shadow-lg hover:shadow-primary/20"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-accent/0 group-hover:from-primary/10 group-hover:via-accent/5 group-hover:to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Icon with glow effect */}
                <motion.div
                  className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 group-hover:from-primary/40 group-hover:to-accent/40 transition-all duration-300 relative z-10 shadow-lg shadow-primary/20 group-hover:shadow-primary/40"
                  whileHover={{ rotate: 10, scale: 1.15 }}
                  transition={{ duration: 0.3 }}
                >
                  <feature.icon className="w-8 h-8 text-primary" />
                </motion.div>

                <h3 className="text-lg font-bold text-foreground mb-3 relative z-10">
                  {feature.title}
                </h3>

                <p className="text-muted-foreground leading-relaxed relative z-10 text-sm">
                  {feature.description}
                </p>

                {/* Animated border accent */}
                <motion.div
                  className="absolute top-0 left-0 h-1 bg-gradient-to-r from-primary via-accent to-primary"
                  initial={{ width: '0%' }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

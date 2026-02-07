import { motion } from 'framer-motion';
import { Activity, Gauge, Terminal, BarChart3 } from 'lucide-react';

const steps = [
  { 
    number: '1', 
    title: 'Capteurs IoT', 
    description: "Des capteurs collectent les données de qualité de l'air en continu", 
    icon: Gauge, 
    details: 'Température, humidité, CO2, particules' 
  },
  { 
    number: '2', 
    title: 'Backend Python', 
    description: 'Les données sont traitées et stockées en temps réel', 
    icon: Terminal, 
    details: 'WebSockets, base de données, alertes' 
  },
  { 
    number: '3', 
    title: 'Dashboard React', 
    description: 'Visualisation interactive et alertes intelligentes', 
    icon: BarChart3, 
    details: 'Graphiques en direct, historique, rapports' 
  }
];

const HowItWorksSection = () => {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-muted/60 to-muted/40" />
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Activity className="w-4 h-4" />
            Architecture Simple
          </motion.span>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Comment Ça Marche
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Une architecture simple et efficace pour la surveillance en temps réel.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, y: 40, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, y: 0, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <motion.div
                whileHover={{ y: -12 }}
                transition={{ duration: 0.3 }}
                className="p-8 rounded-2xl glass-card border border-border/50 hover:border-primary/50 transition-all duration-300 group h-full relative overflow-hidden shadow-lg hover:shadow-primary/20"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Number badge */}
                <motion.div
                  className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-primary font-bold text-2xl shadow-xl group-hover:from-primary/50 group-hover:to-accent/50 transition-all duration-300"
                  whileHover={{ scale: 1.2, rotate: 15 }}
                  transition={{ duration: 0.3 }}
                >
                  {step.number}
                </motion.div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                      className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shadow-lg shadow-primary/30"
                    >
                      <step.icon className="w-6 h-6 text-primary" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed">{step.description}</p>
                  <p className="text-sm text-primary/70 font-medium">
                    {step.details}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

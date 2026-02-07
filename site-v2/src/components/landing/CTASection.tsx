import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, BarChart3, Bell, ArrowRight, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CTASection = () => {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      />

      {/* Animated orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
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
            <Zap className="w-4 h-4" />
            Commencez Maintenant
          </motion.span>

          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Prêt à Découvrir Aerium ?
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Explorez le dashboard complet avec des données en direct, des alertes intelligentes et des analyses avancées.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <motion.div
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/dashboard">
                <Button size="lg" className="gradient-primary text-primary-foreground px-10 h-14 text-lg shadow-lg shadow-primary/25 relative overflow-hidden group">
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.5 }}
                  />
                  <span className="relative flex items-center gap-2">
                    Accéder au Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </Button>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
            >
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="px-10 h-14 text-lg gap-2 hover:bg-primary/5">
                  <Github className="w-5 h-5" />
                  Voir le Code Source
                </Button>
              </a>
            </motion.div>
          </div>

          {/* Info Cards */}
          <motion.div
            className="grid md:grid-cols-3 gap-6 mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, staggerChildren: 0.1 }}
          >
            {[
              { icon: Zap, label: 'Temps Réel', description: 'Mise à jour instantanée' },
              { icon: BarChart3, label: 'Analyse', description: 'Rapports détaillés' },
              { icon: Bell, label: 'Alertes', description: 'Notifications intelligentes' }
            ].map((info, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="p-6 rounded-xl glass-card border border-border/50 hover:border-primary/30 transition-all group"
                whileHover={{ y: -4 }}
              >
                <info.icon className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-foreground mb-1">{info.label}</p>
                <p className="text-sm text-muted-foreground">{info.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

import { motion } from 'framer-motion';
import { Building2, Leaf, Wind, Lightbulb } from 'lucide-react';

const useCases = [
  {
    title: 'Bâtiments Intelligents',
    description: "Surveillance continue de la qualité de l'air intérieur pour optimiser le confort et la santé des occupants.",
    icon: Building2,
    gradient: 'from-blue-500/20 to-cyan-500/20'
  },
  {
    title: 'Environnement & Recherche',
    description: 'Collecte et analyse de données environnementales pour des études scientifiques et le monitoring urbain.',
    icon: Leaf,
    gradient: 'from-green-500/20 to-emerald-500/20'
  },
  {
    title: 'Industrie & Usines',
    description: 'Contrôle qualité atmosphérique en temps réel pour assurer la conformité réglementaire et la sécurité.',
    icon: Wind,
    gradient: 'from-purple-500/20 to-pink-500/20'
  }
];

const UseCasesSection = () => {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background">
      <motion.div
        className="absolute top-1/2 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"
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
            <Lightbulb className="w-4 h-4" />
            Cas d'Usage
          </motion.span>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Parfait Pour
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Découvrez comment Aerium s'adapte à vos besoins spécifiques.
          </p>
        </motion.div>

        {/* Use Cases Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              className="group relative"
              initial={{ opacity: 0, rotateY: 30, y: 40 }}
              whileInView={{ opacity: 1, rotateY: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -8 }}
            >
              <div className="p-8 rounded-2xl glass-card border border-border/50 h-full relative overflow-hidden shadow-lg hover:shadow-primary/20 hover:border-primary/30 transition-all duration-300">
                {/* Animated gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ duration: 0.3 }}
                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 group-hover:from-primary/40 group-hover:to-accent/40 transition-all duration-300"
                  >
                    <useCase.icon className="w-7 h-7 text-primary" />
                  </motion.div>

                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {useCase.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {useCase.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;

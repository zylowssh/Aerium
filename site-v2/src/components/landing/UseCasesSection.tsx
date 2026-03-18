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
    <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-[#eff1f2] via-[#eff1f2] to-[#eff1f2] dark:from-[#0f141c] dark:via-[#0f141c] dark:to-[#0f141c]">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-12 sm:mb-16 lg:mb-20"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-sm font-medium mb-6 border border-cyan-500/25 font-manrope"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Lightbulb className="w-4 h-4" />
            Cas d'Usage
          </motion.span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
            <span className="block font-manrope font-semibold">Concu pour des contextes</span>
            <span className="block font-editorial italic text-cyan-700/90 dark:text-cyan-300/90">reels et exigeants.</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Découvrez comment Aerium s'adapte à vos besoins spécifiques.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              className={`group relative ${index === 1 ? 'md:-translate-y-4' : ''}`}
              initial={{ opacity: 0, rotateY: 30, y: 40 }}
              whileInView={{ opacity: 1, rotateY: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -8 }}
            >
              <div className="p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-[1.75rem] border border-white/45 dark:border-white/15 h-full relative overflow-hidden shadow-xl shadow-black/10 dark:shadow-black/35 bg-white/40 dark:bg-slate-950/60 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300">
                <div className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} dark:opacity-25 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="absolute -inset-12 opacity-45 bg-[radial-gradient(circle_at_20%_12%,rgba(255,255,255,0.65),transparent_35%)] dark:bg-[radial-gradient(circle_at_20%_12%,rgba(56,189,248,0.22),transparent_35%)] pointer-events-none" />

                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ duration: 0.3 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-200/80 to-emerald-200/75 dark:from-cyan-400/30 dark:to-emerald-400/25 flex items-center justify-center mb-6 transition-all duration-300"
                  >
                    <useCase.icon className="w-7 h-7 text-cyan-900 dark:text-cyan-200" />
                  </motion.div>

                  <h3 className="text-xl font-semibold text-foreground mb-3 font-manrope">
                    {useCase.title}
                  </h3>
                  <p className="text-foreground/80 leading-relaxed">
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

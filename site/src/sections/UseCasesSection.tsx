import { motion } from 'framer-motion';
import { Building2, Leaf, Wind, Lightbulb } from 'lucide-react';

const useCases = [
  {
    title: 'Bâtiments Intelligents',
    description: "Surveillance continue de la qualité de l'air intérieur pour optimiser le confort et la santé des occupants.",
    icon: Building2,
    gradient: 'from-blue-500/15 to-cyan-500/15'
  },
  {
    title: 'Environnement & Recherche',
    description: 'Collecte et analyse de données environnementales pour des études scientifiques et le monitoring urbain.',
    icon: Leaf,
    gradient: 'from-green-500/15 to-emerald-500/15'
  },
  {
    title: 'Industrie & Usines',
    description: "Contrôle qualité atmosphérique en temps réel pour assurer la conformité réglementaire et la sécurité.",
    icon: Wind,
    gradient: 'from-purple-500/15 to-pink-500/15'
  }
];

export default function UseCasesSection() {
  return (
    <section className="relative z-10 py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-12 sm:mb-16 lg:mb-20"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-300 text-sm font-medium mb-6 border border-cyan-500/25 font-manrope"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Lightbulb className="w-4 h-4" />
            Cas d'Usage
          </motion.span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl text-white mb-6 leading-tight">
            <span className="block font-manrope font-semibold">Conçu pour des contextes</span>
            <span className="block font-editorial italic text-cyan-300/90">réels et exigeants.</span>
          </h2>
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
              <div className="p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-[1.75rem] border border-white/15 h-full relative overflow-hidden shadow-xl shadow-black/30 bg-slate-950/60 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300">
                <div className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="absolute -inset-12 opacity-45 bg-[radial-gradient(circle_at_20%_12%,rgba(56,189,248,0.22),transparent_35%)] pointer-events-none" />

                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ duration: 0.3 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400/30 to-emerald-400/25 flex items-center justify-center mb-6 transition-all duration-300"
                  >
                    <useCase.icon className="w-7 h-7 text-cyan-200" />
                  </motion.div>

                  <h3 className="text-xl font-semibold text-white mb-3 font-manrope">
                    {useCase.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
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
}

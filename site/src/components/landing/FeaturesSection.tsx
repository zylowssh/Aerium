import { motion } from 'framer-motion';
import { BarChart3, Bell, TrendingUp, Wind, Gauge, Lightbulb, Sparkles } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Cartographie Vivante',
    description: "Visualisez les variations de l'air comme un paysage dynamique, pas comme un tableau figé.",
    tone: 'from-emerald-200/70 via-teal-100/65 to-cyan-100/55',
    offset: 'lg:-translate-y-3'
  },
  {
    icon: Bell,
    title: 'Alertes Sensibles',
    description: 'Des notifications contextualisées qui distinguent un incident ponctuel d\'une tendance profonde.',
    tone: 'from-amber-200/70 via-orange-100/60 to-rose-100/45',
    offset: 'lg:translate-y-4'
  },
  {
    icon: TrendingUp,
    title: 'Récits de Tendances',
    description: "Comparez les trajectoires historiques pour lire l\'évolution de vos espaces comme une histoire.",
    tone: 'from-sky-200/70 via-indigo-100/55 to-white/40',
    offset: 'lg:-translate-y-2'
  },
  {
    icon: Wind,
    title: 'Orchestre Multi-Capteurs',
    description: 'SCD30, CO2, température, humidité : chaque source trouve sa place dans une vue harmonisée.',
    tone: 'from-emerald-100/75 via-lime-100/55 to-white/45',
    offset: 'lg:translate-y-5'
  },
  {
    icon: Gauge,
    title: 'Métriques Poids Plume',
    description: 'Des indicateurs précis, hiérarchisés et légers à parcourir même sous pression.',
    tone: 'from-violet-200/70 via-fuchsia-100/55 to-rose-100/45',
    offset: 'lg:-translate-y-1'
  },
  {
    icon: Lightbulb,
    title: 'Actions Créables',
    description: "Des recommandations immédiates pour passer de l\'observation à l\'amélioration durable.",
    tone: 'from-cyan-200/70 via-blue-100/55 to-white/45',
    offset: 'lg:translate-y-3'
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
    <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-[#eff1f2] via-[#eff1f2] to-[#eff1f2] dark:from-[#0f141c] dark:via-[#0f141c] dark:to-[#0f141c]">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-12"
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20 font-manrope"
            variants={scaleInVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Sparkles className="w-4 h-4" />
            Atelier des Possibles
          </motion.span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
            <span className="block font-manrope font-semibold">Un outillage environnemental</span>
            <span className="block font-editorial italic text-primary/90">plus créatif que standard.</span>
          </h2>
        </motion.div>

        <motion.div
          className="mb-6 sm:mb-8 rounded-xl sm:rounded-[2rem] border border-white/45 dark:border-white/15 bg-white/45 dark:bg-black/30 backdrop-blur-2xl p-5 sm:p-7 lg:p-8"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
        >
          <p className="text-lg sm:text-2xl lg:text-3xl text-foreground leading-snug font-editorial">
            Aerium ne montre pas seulement des chiffres: il donne une forme
            à la qualité de l'air pour accélérer les bonnes décisions.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <motion.article
              key={index}
              className={`group relative overflow-hidden rounded-xl sm:rounded-[2rem] border border-white/40 dark:border-white/15 p-5 sm:p-7 shadow-xl backdrop-blur-xl bg-white/35 dark:bg-black/30 ${feature.offset}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10, rotate: index % 2 === 0 ? -0.45 : 0.45 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.tone} dark:opacity-25 opacity-90 pointer-events-none`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <span className="w-14 h-14 rounded-2xl bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/20 flex items-center justify-center shadow-sm">
                    <feature.icon className="w-7 h-7 text-foreground" />
                  </span>
                  <span className="text-xs font-semibold tracking-[0.22em] text-foreground/65 font-manrope">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="text-2xl font-semibold text-foreground mb-3 leading-tight font-manrope">
                  {feature.title}
                </h3>

                <p className="text-foreground/80 leading-relaxed text-sm font-manrope">
                  {feature.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

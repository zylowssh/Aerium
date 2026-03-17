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
    description: 'Des notifications contextualisees qui distinguent incident ponctuel et tendance profonde.',
    tone: 'from-amber-200/70 via-orange-100/60 to-rose-100/45',
    offset: 'lg:translate-y-4'
  },
  {
    icon: TrendingUp,
    title: 'Recits de Tendances',
    description: "Comparez les trajectoires historiques pour lire l'evolution de vos espaces comme une histoire.",
    tone: 'from-sky-200/70 via-indigo-100/55 to-white/40',
    offset: 'lg:-translate-y-2'
  },
  {
    icon: Wind,
    title: 'Orchestre Multi-Capteurs',
    description: 'SCD30, CO2, temperature, humidite: chaque source trouve sa place dans une vue harmonisee.',
    tone: 'from-emerald-100/75 via-lime-100/55 to-white/45',
    offset: 'lg:translate-y-5'
  },
  {
    icon: Gauge,
    title: 'Metriques Poids Plume',
    description: 'Des indicateurs precis, hierarchises et legers a parcourir meme sous pression.',
    tone: 'from-violet-200/70 via-fuchsia-100/55 to-rose-100/45',
    offset: 'lg:-translate-y-1'
  },
  {
    icon: Lightbulb,
    title: 'Actions Creables',
    description: "Des recommandations immediates pour passer de l'observation a l'amelioration durable.",
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
    <section className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background">
      <motion.div
        className="absolute -top-20 left-[12%] w-[34rem] h-[34rem] bg-emerald-400/15 rounded-full blur-3xl pointer-events-none"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      />
      <motion.div
        className="absolute bottom-0 right-[8%] w-[30rem] h-[30rem] bg-sky-400/15 rounded-full blur-3xl pointer-events-none"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.2 }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-20"
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
            <span className="block font-editorial italic text-primary/90">plus creatif que standard.</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Chaque fonctionnalite a ete repensee comme une experience de lecture,
            de decision et d'impact concret.
          </p>
        </motion.div>

        <motion.div
          className="mb-8 rounded-[2rem] border border-white/45 dark:border-white/15 bg-white/45 dark:bg-black/30 backdrop-blur-2xl p-7 sm:p-8"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
        >
          <p className="text-sm uppercase tracking-[0.24em] text-foreground/60 mb-3 font-manrope">Manifeste de section</p>
          <p className="text-2xl sm:text-3xl text-foreground leading-snug font-editorial">
            Nous ne montrons pas seulement des chiffres: nous donnons une forme sensible
            a la qualite de l'air pour accelerer les bonnes decisions.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.article
              key={index}
              className={`group relative overflow-hidden rounded-[2rem] border border-white/40 dark:border-white/15 p-7 shadow-xl backdrop-blur-xl bg-white/35 dark:bg-black/30 ${feature.offset}`}
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

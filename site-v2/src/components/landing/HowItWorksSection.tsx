import { motion } from 'framer-motion';
import { Activity, Gauge, Terminal, BarChart3, Sparkles } from 'lucide-react';

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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6 border border-emerald-500/25 font-manrope"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Activity className="w-4 h-4" />
            Architecture Simple
          </motion.span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
            <span className="block font-manrope font-semibold">Comment Aerium</span>
            <span className="block font-editorial italic text-emerald-700/90 dark:text-emerald-300/90">orchestre chaque etape.</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Une architecture simple et efficace pour la surveillance en temps réel.
          </p>
        </motion.div>

        <motion.div
          className="mb-6 sm:mb-8 lg:mb-10 rounded-xl sm:rounded-[2rem] border border-white/45 dark:border-white/15 bg-white/45 dark:bg-slate-950/55 backdrop-blur-2xl p-5 sm:p-7 lg:p-8"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
        >
          <p className="text-lg sm:text-2xl lg:text-3xl text-foreground leading-snug font-editorial">
            Du capteur a la decision, le flux est pense pour rester lisible,
            rapide et utile meme quand les donnees accelerent.
          </p>
        </motion.div>

        <div className="relative grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="hidden md:block absolute top-1/2 left-[16%] right-[16%] -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-emerald-400/35 to-transparent pointer-events-none" />
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
                className="p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-[1.75rem] border border-white/45 dark:border-white/15 bg-white/40 dark:bg-slate-950/60 backdrop-blur-xl transition-all duration-300 group h-full relative overflow-hidden shadow-xl shadow-black/10 dark:shadow-black/35"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/70 via-cyan-100/50 to-white/35 dark:from-[#111c2f]/88 dark:via-[#13253d]/72 dark:to-[#0f141c]/45 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -inset-16 opacity-50 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.55),transparent_35%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(15,20,28,0.72),transparent_35%)] pointer-events-none" />

                <motion.div
                  className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-300/80 to-cyan-200/70 dark:from-emerald-400/45 dark:to-cyan-400/35 flex items-center justify-center text-emerald-900 dark:text-emerald-100 font-semibold text-2xl shadow-xl transition-all duration-300"
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
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-300/70 to-cyan-200/70 dark:from-emerald-400/30 dark:to-cyan-400/25 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                    >
                      <step.icon className="w-6 h-6 text-emerald-900 dark:text-emerald-200" />
                    </motion.div>
                    <h3 className="text-2xl font-semibold text-foreground font-manrope">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-foreground/80 mb-4 leading-relaxed">{step.description}</p>
                  <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80 font-medium inline-flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
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

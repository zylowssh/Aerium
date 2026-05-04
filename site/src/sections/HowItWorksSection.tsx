import { motion } from 'framer-motion';
import { Activity, Gauge, Terminal, BarChart3 } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Capteurs IoT',
    description: "Des capteurs collectent les données de qualité de l'air en continu",
    icon: Gauge,
    details: 'Température, humidité, CO2, particules',
    gradient: 'from-emerald-500/20 to-cyan-500/20'
  },
  {
    number: '02',
    title: 'Serveur Python',
    description: 'Les données sont traitées et stockées en temps réel',
    icon: Terminal,
    details: 'WebSockets, base de données, alertes',
    gradient: 'from-cyan-500/20 to-blue-500/20'
  },
  {
    number: '03',
    title: 'Tableau de bord React',
    description: 'Visualisation interactive et alertes intelligentes',
    icon: BarChart3,
    details: 'Graphiques en direct, historique, rapports',
    gradient: 'from-blue-500/20 to-indigo-500/20'
  }
];

export default function HowItWorksSection() {
  return (
    <section className="relative z-10 py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-300 text-sm font-medium mb-6 border border-emerald-500/25 font-manrope"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Activity className="w-4 h-4" />
            Architecture Simple
          </motion.span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl text-white mb-6 leading-tight">
            <span className="block font-manrope font-semibold">Comment Aerium</span>
            <span className="block font-editorial italic text-emerald-300/90">orchestre chaque étape.</span>
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Une architecture simple et efficace pour la surveillance en temps réel.
          </p>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-[16.66%] right-[16.66%] -translate-y-1/2 z-0">
            <motion.div
              className="border-t border-dashed border-white/10 w-full"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
              style={{ transformOrigin: 'left' }}
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative overflow-hidden rounded-xl sm:rounded-[2rem] border border-white/15 bg-slate-950/60 backdrop-blur-2xl p-5 sm:p-7 lg:p-8"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                <motion.span
                  className="absolute top-3 right-4 font-manrope font-extrabold text-[clamp(3rem,6vw,5rem)] text-white/[0.08] leading-none select-none"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.08 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: index * 0.15 + 0.2 }}
                >
                  {step.number}
                </motion.span>

                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-3 font-manrope">
                    {step.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed mb-4">
                    {step.description}
                  </p>
                  <span className="inline-block px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs font-manrope">
                    {step.details}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

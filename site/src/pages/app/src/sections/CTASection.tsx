import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Github, Wind, BarChart3, Clock3, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ctaHighlights = [
  { icon: Wind, label: 'Flux continu', description: "Des capteurs qui racontent ce qu'il se passe maintenant." },
  { icon: BarChart3, label: 'Lecture immédiate', description: 'Des visualisations faites pour décider sans hésiter.' },
  { icon: Clock3, label: 'Impact durable', description: 'Des routines quotidiennes qui produisent des effets à long terme.' },
  { icon: Bell, label: 'Signal Prioritaire', description: 'Des alertes intelligentes selon le niveau de criticité.' },
];

export default function CTASection() {
  return (
    <section className="relative z-10 py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          className="relative overflow-hidden rounded-xl sm:rounded-[2.5rem] border border-white/15 bg-slate-950/70 backdrop-blur-2xl p-5 sm:p-8 lg:p-12"
          initial={{ opacity: 0, y: 34 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65 }}
        >
          {/* Decorative glows */}
          <div className="absolute -top-14 -right-14 w-52 h-52 rounded-full bg-emerald-300/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-52 h-52 rounded-full bg-cyan-300/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-6 sm:gap-8 lg:gap-10">
            {/* Left column */}
            <div>
              <motion.span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-300 text-sm font-medium mb-6 border border-emerald-500/20 font-manrope"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <Sparkles className="w-4 h-4" />
                Et si votre tableau de bord inspirait vraiment ?
              </motion.span>

              <motion.h2
                className="text-4xl sm:text-5xl lg:text-6xl text-white mb-6 leading-tight"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15, duration: 0.6 }}
              >
                <span className="block font-manrope font-semibold">Faites entrer Aerium</span>
                <span className="block font-editorial italic text-emerald-300/90">dans votre routine d'impact.</span>
              </motion.h2>

              <motion.p
                className="text-base sm:text-lg lg:text-xl text-white/60 mb-6 sm:mb-8 lg:mb-10 max-w-2xl lg:max-w-none font-manrope"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Un environnement plus sain commence par une lecture plus claire de l'air.
                Passez de la surveillance passive à une pratique active, quotidienne et mesurable.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row items-start gap-4"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <Link to="/dashboard">
                  <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="h-12 sm:h-14 px-6 sm:px-9 rounded-full bg-white text-slate-900 hover:bg-white/90 text-sm sm:text-base font-manrope font-semibold">
                      Ouvrir le tableau de bord
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </Link>
                <a href="https://github.com/zylowssh/Aerium" target="_blank" rel="noopener noreferrer">
                  <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" variant="outline" className="h-12 sm:h-14 px-5 sm:px-8 rounded-full border-white/25 bg-white/[0.04] text-white hover:bg-white/15 hover:text-white gap-2 text-sm sm:text-base font-manrope">
                      <Github className="w-5 h-5" />
                      Voir sur GitHub
                    </Button>
                  </motion.div>
                </a>
              </motion.div>
            </div>

            {/* Right column — mini cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {ctaHighlights.map((item, index) => (
                <motion.div
                  key={index}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                >
                  <item.icon className="w-5 h-5 text-emerald-300 mb-3" />
                  <p className="text-sm font-semibold text-white mb-1 font-manrope">{item.label}</p>
                  <p className="text-xs text-white/50 leading-relaxed font-manrope">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

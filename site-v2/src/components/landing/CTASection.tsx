import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, BarChart3, Bell, ArrowRight, Github, Wind, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ctaHighlights = [
  { icon: Wind, label: 'Flux continu', description: "Des capteurs qui racontent ce qu'il se passe maintenant." },
  { icon: BarChart3, label: 'Lecture immédiate', description: 'Des visualisations faites pour décider sans hésiter.' },
  { icon: Clock3, label: 'Impact durable', description: 'Des routines quotidiennes qui produisent des effets à long terme.' },
  { icon: Bell, label: 'Signal Prioritaire', description: 'Des alertes intelligentes selon le niveau de criticité.' }
];

const CTASection = () => {
  return (
    <section className="relative z-20 -mb-2 rounded-b-[2rem] sm:rounded-b-[3rem] lg:rounded-b-[3.5rem] py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-[#eff1f2] via-[#eff1f2] to-[#eff1f2] dark:from-[#0f141c] dark:via-[#0f141c] dark:to-[#0f141c]">
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          className="relative overflow-hidden rounded-xl sm:rounded-[2rem] lg:rounded-[2.5rem] border border-white/45 dark:border-white/15 bg-white/45 dark:bg-black/35 backdrop-blur-2xl p-5 sm:p-8 lg:p-12"
          initial={{ opacity: 0, y: 34 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
        >
          <div className="absolute -top-14 -right-14 w-52 h-52 rounded-full bg-emerald-300/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-52 h-52 rounded-full bg-cyan-300/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-6 sm:gap-8 lg:gap-10">
            <div className="text-center lg:text-left">
              <motion.span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20 font-manrope"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <Sparkles className="w-4 h-4" />
                Et si votre tableau de bord inspirait vraiment ?
              </motion.span>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
                <span className="block font-manrope font-semibold">Faites entrer Aerium</span>
                <span className="block font-editorial italic text-primary/90">dans votre routine d'impact.</span>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 lg:mb-10 max-w-2xl lg:max-w-none font-manrope">
                Un environnement plus sain commence par une lecture plus claire de l'air.
                Passez de la surveillance passive à une pratique active, quotidienne et mesurable.
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4">
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/dashboard">
                    <Button size="lg" className="h-12 sm:h-14 px-6 sm:px-9 rounded-full bg-foreground text-background hover:opacity-90 text-sm sm:text-base font-manrope font-semibold">
                      Ouvrir le tableau de bord
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" variant="outline" className="h-12 sm:h-14 px-5 sm:px-8 rounded-full border-foreground/25 bg-foreground/[0.04] text-foreground hover:bg-foreground hover:text-background dark:border-white/30 dark:bg-white/5 dark:text-white dark:hover:bg-white/15 dark:hover:text-white gap-2 text-sm sm:text-base font-manrope">
                      <Github className="w-5 h-5" />
                      Parcourir le projet
                    </Button>
                  </a>
                </motion.div>
              </div>
            </div>

            <motion.div
              className="grid grid-cols-2 gap-3 sm:gap-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, staggerChildren: 0.08 }}
            >
              {ctaHighlights.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index }}
                  className="p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-white/40 dark:border-white/15 bg-white/40 dark:bg-black/30 backdrop-blur-xl"
                  whileHover={{ y: -5, rotate: index % 2 === 0 ? -0.5 : 0.5 }}
                >
                  <item.icon className="w-5 h-5 sm:w-7 sm:h-7 text-primary mb-2 sm:mb-3" />
                  <p className="font-manrope font-semibold text-foreground text-sm sm:text-base mb-1">{item.label}</p>
                  <p className="text-xs sm:text-sm text-foreground/75 font-manrope leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

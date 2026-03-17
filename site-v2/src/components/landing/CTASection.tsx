import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, BarChart3, Bell, ArrowRight, Github, Wind, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ctaHighlights = [
  { icon: Wind, label: 'Flux Continu', description: "Des capteurs qui racontent ce qu'il se passe maintenant." },
  { icon: BarChart3, label: 'Lecture Immediate', description: 'Des visualisations faites pour decider sans hesiter.' },
  { icon: Clock3, label: 'Impact Durable', description: 'Des routines quotidiennes qui produisent des effets long terme.' },
  { icon: Bell, label: 'Signal Prioritaire', description: 'Des alertes intelligentes selon le niveau de criticite.' }
];

const CTASection = () => {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-cyan-400/10 to-sky-500/15"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      />
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

      <motion.div
        className="absolute top-[14%] left-[12%] w-72 h-72 bg-primary/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-[8%] right-[10%] w-80 h-80 bg-accent/20 rounded-full blur-3xl"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          className="relative overflow-hidden rounded-[2.5rem] border border-white/45 dark:border-white/15 bg-white/45 dark:bg-black/35 backdrop-blur-2xl p-8 sm:p-10 lg:p-12"
          initial={{ opacity: 0, y: 34 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
        >
          <div className="absolute -top-14 -right-14 w-52 h-52 rounded-full bg-emerald-300/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-52 h-52 rounded-full bg-cyan-300/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-10">
            <div className="text-center lg:text-left">
              <motion.span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20 font-manrope"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <Sparkles className="w-4 h-4" />
                Et si votre dashboard inspirait vraiment ?
              </motion.span>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
                <span className="block font-manrope font-semibold">Faites entrer Aerium</span>
                <span className="block font-editorial italic text-primary/90">dans votre routine d'impact.</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl lg:max-w-none font-manrope">
                Un environnement plus sain commence par une lecture plus claire de l'air.
                Passez de la surveillance passive a une pratique active, quotidienne et mesurable.
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4">
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/dashboard">
                    <Button size="lg" className="h-14 px-9 rounded-full bg-foreground text-background hover:opacity-90 text-base font-manrope font-semibold">
                      Ouvrir le Dashboard
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-white/60 bg-white/20 dark:bg-black/20 hover:bg-white/40 dark:hover:bg-black/40 gap-2 font-manrope">
                      <Github className="w-5 h-5" />
                      Parcourir le projet
                    </Button>
                  </a>
                </motion.div>
              </div>
            </div>

            <motion.div
              className="grid sm:grid-cols-2 gap-4"
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
                  className="p-5 rounded-2xl border border-white/40 dark:border-white/15 bg-white/40 dark:bg-black/30 backdrop-blur-xl"
                  whileHover={{ y: -5, rotate: index % 2 === 0 ? -0.5 : 0.5 }}
                >
                  <item.icon className="w-7 h-7 text-primary mb-3" />
                  <p className="font-manrope font-semibold text-foreground mb-1">{item.label}</p>
                  <p className="text-sm text-foreground/75 font-manrope leading-relaxed">{item.description}</p>
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

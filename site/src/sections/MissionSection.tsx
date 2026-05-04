import { useRef } from 'react';
import { motion } from 'framer-motion';

export default function MissionSection() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={ref}
      className="relative z-10 border-t border-white/5 bg-slate-950/80 backdrop-blur-sm"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center">
        <motion.div
          className="flex justify-center mb-8"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="w-[120px] h-px bg-white/20" />
        </motion.div>

        <motion.p
          className="font-manrope uppercase tracking-[0.2em] text-emerald-400/80 text-xs mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          La qualité de l'air, enfin claire
        </motion.p>

        <motion.h2
          className="font-editorial italic text-[clamp(1.5rem,3vw,2.5rem)] text-white/90 leading-[1.3] mb-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          « Ce que vous ne voyiez pas peut désormais guider chacune de vos décisions. »
        </motion.h2>

        <motion.p
          className="font-manrope font-medium text-white/60 max-w-[600px] mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          Aerium transforme les données brutes de vos capteurs en un récit visuel, instantané et actionnable.
        </motion.p>
      </div>
    </section>
  );
}

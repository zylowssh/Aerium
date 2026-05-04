import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onScrollToSection?: () => void;
}

export default function HeroSection({ onScrollToSection }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 flex items-start justify-center overflow-hidden">
      <div className="max-w-6xl w-full mx-auto relative z-10 pt-40">
        <motion.div
          className="max-w-[42rem] mx-auto text-center"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.p
            className="font-manrope uppercase tracking-[0.3em] text-white/80 text-xs sm:text-sm mb-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7 }}
          >
            Aerium
          </motion.p>

          <h1 className="leading-[0.96] tracking-[-0.03em]">
            <motion.span
              className="block font-manrope font-extrabold text-[clamp(2.1rem,7vw,5.2rem)] text-white drop-shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.85, ease: 'easeOut' }}
            >
              Respirez l'esprit tranquille.
            </motion.span>
          </h1>

          <motion.p
            className="mt-5 max-w-[65ch] font-manrope font-medium text-[clamp(0.98rem,2.1vw,1.28rem)] leading-relaxed text-white/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.8, ease: 'easeOut' }}
          >
            Surveillez la qualité de l'air en temps réel et passez à l'action en quelques secondes grâce à des alertes lisibles et un tableau de bord opérationnel.
          </motion.p>

          <motion.div
            className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: 'easeOut' }}
          >
            <Link to="/dashboard">
              <Button size="lg" className="h-12 sm:h-14 px-7 rounded-full bg-white text-slate-900 hover:bg-white/90 font-manrope font-semibold">
                Ouvrir le tableau de bord
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={onScrollToSection}
              className="h-12 sm:h-14 px-7 rounded-full border-white/55 bg-transparent text-white hover:bg-white/15 hover:text-white font-manrope font-semibold"
            >
              Découvrir
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

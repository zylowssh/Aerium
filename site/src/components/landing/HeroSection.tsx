import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import heroDarkImage from '@/assets/landing/hero-dark-nature.jpg';
import heroDarkVideo from '@/assets/landing/hero-dark-nature.mp4';
import heroLightImage from '@/assets/landing/hero-light-nature.jpg';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onScrollToSection?: () => void;
}

const HeroSection = ({ onScrollToSection }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 flex items-start justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-200/20 via-sky-200/10 to-slate-950/90 dark:from-emerald-600/20 dark:via-sky-500/15 dark:to-slate-950" />
          <div
            className="absolute inset-0 transition-opacity duration-700 opacity-100 dark:opacity-0"
            style={{
              background:
                'radial-gradient(circle at 20% 18%, rgba(110, 231, 183, 0.38), transparent 44%), radial-gradient(circle at 82% 76%, rgba(125, 211, 252, 0.28), transparent 40%)'
            }}
          />
          <div
            className="absolute inset-0 transition-opacity duration-700 opacity-0 dark:opacity-100"
            style={{
              background:
                'radial-gradient(circle at 16% 22%, rgba(16, 185, 129, 0.32), transparent 46%), radial-gradient(circle at 86% 74%, rgba(56, 189, 248, 0.24), transparent 38%)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/70" />
        </div>

        <div className="hidden lg:block absolute inset-0 transition-all duration-1000 ease-out will-change-[opacity,transform,filter] motion-reduce:transition-none opacity-100 dark:opacity-0 scale-100 dark:scale-[1.03] blur-0 dark:blur-[4px] brightness-100 dark:brightness-75">
          <img
            src={heroLightImage}
            alt="Paysage naturel"
            className="absolute inset-0 h-full w-full object-cover object-[center_28%]"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/35 to-black/70" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 18% 24%, rgba(16, 185, 129, 0.30), transparent 46%), radial-gradient(circle at 85% 72%, rgba(56, 189, 248, 0.18), transparent 36%)'
            }}
          />
        </div>

        <div className="hidden lg:block absolute inset-0 overflow-hidden transition-all duration-1000 ease-out will-change-[opacity,transform,filter] motion-reduce:transition-none opacity-0 dark:opacity-100 scale-[1.03] dark:scale-100 blur-[4px] dark:blur-0 brightness-125 dark:brightness-100">
          <img
            src={heroDarkImage}
            alt="Paysage naturel de nuit"
            className="absolute inset-0 h-full w-full object-cover object-[center_24%]"
            loading="eager"
          />
          <video
            className="absolute inset-0 h-full w-full object-cover object-[center_24%] motion-reduce:hidden"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={heroDarkImage}
            aria-hidden="true"
          >
            <source src={heroDarkVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/80" />
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/45 via-transparent to-transparent" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/45 via-transparent to-transparent" />

      <div className="max-w-6xl w-full mx-auto relative z-10 pt-40">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="max-w-[42rem] mx-auto text-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <motion.p
              className="font-manrope uppercase tracking-[0.3em] text-white/80 text-xs sm:text-sm mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Aerium
            </motion.p>

            <h1 className="leading-[0.96] tracking-[-0.03em]">
              <motion.span
                className="block font-manrope font-extrabold text-[clamp(2.1rem,7vw,5.2rem)] text-white drop-shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.8, ease: 'easeOut' }}
              >
                Respirez l'esprit tranquille.
              </motion.span>
            </h1>

            <motion.p
              className="mt-5 max-w-[65ch] font-manrope font-medium text-[clamp(0.98rem,2.1vw,1.28rem)] leading-relaxed text-white/90"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.8, ease: 'easeOut' }}
            >
              Surveillez la qualité de l'air en temps réel et passez à l'action en quelques secondes grâce à des alertes lisibles et un tableau de bord opérationnel.
            </motion.p>

            <motion.div
              className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-3"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.7, ease: 'easeOut' }}
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
        </motion.div>
      </div>

    </section>
  );
};

export default HeroSection;



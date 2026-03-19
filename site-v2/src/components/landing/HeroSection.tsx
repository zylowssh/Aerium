import { motion } from 'framer-motion';
import heroDarkImage from '@/assets/landing/hero-dark-nature.jpg';
import heroLightImage from '@/assets/landing/hero-light-nature.jpg';

const heroVideoUrl = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260228_065522_522e2295-ba22-457e-8fdb-fbcd68109c73.mp4';

interface HeroSectionProps {
  onScrollToSection?: () => void;
}

const HeroSection = ({ onScrollToSection }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen pt-24 sm:pt-28 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center overflow-hidden">
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
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
          <motion.div
            className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-emerald-300/35 dark:bg-primary/25 blur-3xl"
            animate={{ x: [0, 18, 0], y: [0, 24, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-24 right-[-2rem] h-72 w-72 rounded-full bg-sky-300/30 dark:bg-accent/20 blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, -18, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          />
        </div>

        <div className="hidden lg:block absolute inset-0 transition-all duration-1000 ease-out will-change-[opacity,transform,filter] motion-reduce:transition-none opacity-100 dark:opacity-0 scale-100 dark:scale-[1.03] blur-0 dark:blur-[4px] brightness-100 dark:brightness-75">
        <img
          src={heroLightImage}
          alt="Paysage naturel"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        {/*}
        <video
          className="absolute inset-0 h-full w-full object-cover hidden sm:block"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={heroFallbackImageUrl}
          aria-hidden="true"
        >
          <source src={heroVideoUrl} type="video/mp4" />
        </video> */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/35 to-black/70" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 18% 24%, rgba(16, 185, 129, 0.30), transparent 46%), radial-gradient(circle at 85% 72%, rgba(56, 189, 248, 0.18), transparent 36%)'
          }}
        />
        <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
        </div>

        <div className="hidden lg:block absolute inset-0 overflow-hidden transition-all duration-1000 ease-out will-change-[opacity,transform,filter] motion-reduce:transition-none opacity-0 dark:opacity-100 scale-[1.03] dark:scale-100 blur-[4px] dark:blur-0 brightness-125 dark:brightness-100">
        <img
          src={heroDarkImage}
          alt="Paysage naturel de nuit"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/80" />
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/15 rounded-full blur-3xl"
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/45 via-transparent to-transparent" />

      <div className="max-w-6xl w-full mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="text-center mb-6 sm:mb-10 lg:mb-12 lg:mt-24 -mt-4 sm:-mt-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <motion.p
              className="font-manrope uppercase tracking-[0.32em] text-white/80 text-xs sm:text-sm mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Aerium
            </motion.p>

            <h1 className="leading-[0.96] tracking-[-0.03em]">
              <motion.span
                className="block font-manrope font-extrabold text-[clamp(2.1rem,7vw,5.4rem)] text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-sky-200 animate-gradient drop-shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.8, ease: 'easeOut' }}
              >
                Respirez l'esprit tranquille.
              </motion.span>
            </h1>

            <motion.p
              className="mt-5 mx-auto max-w-2xl font-manrope font-medium text-[clamp(0.95rem,2.15vw,1.35rem)] leading-relaxed text-white/90"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.8, ease: 'easeOut' }}
            >
              Surveillez la qualité de l'air en temps réel grâce à des capteurs intelligents.
            </motion.p>
          </motion.div>

          <motion.div
            className="h-[160px] sm:h-[220px] lg:h-[300px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.6 }}
          />
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="mt-8 sm:mt-16 lg:mt-20 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <motion.button
            onClick={onScrollToSection}
            className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors cursor-pointer group"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-xs font-medium tracking-wider uppercase">Scroll to explore</span>
            <motion.div
              className="w-6 h-10 rounded-full border-2 border-white/45 flex items-start justify-center p-1 group-hover:border-white transition-colors"
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div className="w-1 h-2 bg-white rounded-full" />
            </motion.div>
          </motion.button>
        </motion.div>
      </div>

    </section>
  );
};

export default HeroSection;



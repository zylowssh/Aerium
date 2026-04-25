import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { BarChart3, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import aeriumLogo    from '@/assets/aerium-logo.png';
import heroDarkVideo from '@/assets/landing/hero-dark-nature.mp4';
import heroDarkImage from '@/assets/landing/hero-dark-nature.jpg';

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const STYLES = `
  .ph1-text-3d-matte {
    color: #ffffff;
    text-shadow:
      0 10px 30px rgba(255,255,255,0.15),
      0 2px 4px rgba(255,255,255,0.08);
  }
  .ph1-text-silver-matte {
    background: linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.35) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transform: translateZ(0);
    filter:
      drop-shadow(0px 10px 20px rgba(255,255,255,0.12))
      drop-shadow(0px 2px 4px rgba(255,255,255,0.08));
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// SHARED VIDEO BACKGROUND  (mounted once, never removed)
// ─────────────────────────────────────────────────────────────────────────────

function SharedBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* The video — same source, same crop as original CinematicHero */}
      <video
        className="h-full w-full object-cover object-[center_24%] motion-reduce:hidden"
        autoPlay muted loop playsInline preload="metadata"
        poster={heroDarkImage}
      >
        <source src={heroDarkVideo} type="video/mp4" />
      </video>

      {/* Overlay stack — matches the original cinematic phase exactly */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-slate-950/96" />

      {/* Colour atmosphere */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 16% 22%, rgba(16,185,129,0.18) 0%, transparent 46%),' +
            'radial-gradient(circle at 86% 74%, rgba(56,189,248,0.12) 0%, transparent 38%)',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — Cinematic text overlay  (sits above SharedBackground)
// ─────────────────────────────────────────────────────────────────────────────

interface CinematicHeroProps {
  onComplete: () => void;
  tagline1?: string;
  tagline2?: string;
  className?: string;
}

export function CinematicHero({
  onComplete,
  tagline1 = "L'invisible",
  tagline2 = 'rendu visible.',
  className,
}: CinematicHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete();
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set('.ph1-text-track', {
        autoAlpha: 0, y: 60, scale: 0.85, filter: 'blur(20px)', rotationX: -20,
      });
      gsap.set('.ph1-text-days', { autoAlpha: 1, clipPath: 'inset(0 100% 0 0)' });

      gsap.timeline({ delay: 0.25,
        onComplete: () =>
          // Only fade the text layer out — background stays put
          gsap.to(containerRef.current, {
            opacity: 0, duration: 0.8, ease: 'power2.inOut', onComplete: onComplete,
          }),
      })
        .to('.ph1-text-track', {
          duration: 1.8, autoAlpha: 1, y: 0, scale: 1,
          filter: 'blur(0px)', rotationX: 0, ease: 'expo.out',
        })
        .to('.ph1-text-days', {
          duration: 1.4, clipPath: 'inset(0 0% 0 0)', ease: 'power4.inOut',
        }, '-=1.0')
        // Hold so the viewer can read
        .to({}, { duration: 1.2 })
        // Text exits upward
        .to(['.ph1-text-track', '.ph1-text-days'], {
          y: -32, opacity: 0, filter: 'blur(14px)', scale: 1.04,
          duration: 0.8, ease: 'power3.in', stagger: 0.06,
        });
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    // Covers the whole screen but has NO background of its own —
    // SharedBackground shows through
    <div
      ref={containerRef}
      className={cn(
        'fixed inset-0 z-10 flex items-center justify-center pointer-events-none',
        className
      )}
    >
      <div
        className="flex flex-col items-center justify-center text-center w-screen px-4"
        style={{ perspective: '1000px' }}
      >
        <h1 className="ph1-text-track ph1-text-3d-matte text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tight mb-2">
          {tagline1}
        </h1>
        <h1 className="ph1-text-days ph1-text-silver-matte text-5xl md:text-7xl lg:text-[6rem] font-extrabold tracking-tighter">
          {tagline2}
        </h1>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — Real hero content  (Navbar + HeroSection from Landing)
// Background is SharedBackground — no bg layers here at all
// ─────────────────────────────────────────────────────────────────────────────

function RealNavbar({ onScrollToSection }: { onScrollToSection?: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className="fixed z-50 left-1/2"
      initial={{ y: -80, x: '-50%', opacity: 0 }}
      animate={{ y: 0,   x: '-50%', opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      style={{
        top: isScrolled ? '10px' : '14px',
        width: 'min(980px, calc(100vw - 16px))',
        transition: 'top 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        className="w-full h-full overflow-hidden rounded-[2rem] border"
        style={{
          background: isLight
            ? 'linear-gradient(110deg, rgba(255,255,255,0.72), rgba(225,246,239,0.5))'
            : 'linear-gradient(110deg, rgba(5,18,23,0.78), rgba(13,25,37,0.72))',
          backdropFilter: 'blur(20px) saturate(165%)',
          WebkitBackdropFilter: 'blur(20px) saturate(165%)',
          borderColor: isLight ? 'rgba(255,255,255,0.68)' : 'rgba(117,180,184,0.35)',
          boxShadow: isScrolled ? '0 20px 45px rgba(0,0,0,0.24)' : '0 14px 34px rgba(0,0,0,0.18)',
          transition: 'box-shadow 0.35s ease',
        }}
      >
        <div className="px-3 sm:px-5 lg:px-7 flex items-center justify-between w-full h-[56px] sm:h-[64px] lg:h-[68px] gap-2 sm:gap-3">

          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={aeriumLogo} alt="Aerium"
              className="h-9 sm:h-10 w-auto drop-shadow-[0_10px_18px_rgba(0,0,0,0.3)] transition-all duration-300 group-hover:scale-105"
            />
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-base font-semibold text-foreground tracking-tight font-manrope">Aerium</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center rounded-full px-2 py-1 border border-white/40 dark:border-white/15 bg-white/35 dark:bg-black/30 shadow-inner">
            <button
              onClick={onScrollToSection}
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors rounded-full px-4 py-2 font-manrope hover:bg-white/40 dark:hover:bg-white/10"
            >
              Découvrir
            </button>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={toggleTheme}
              className="p-2.5 rounded-full border border-white/40 dark:border-white/20 bg-white/30 dark:bg-black/35 hover:bg-white/55 dark:hover:bg-black/55 transition-colors"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              aria-label="Basculer le thème"
            >
              {isLight ? <Moon className="w-4 h-4 text-foreground" /> : <Sun className="w-4 h-4 text-foreground" />}
            </motion.button>
            <Link to="/dashboard">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="sm" className="h-9 rounded-full px-4 bg-foreground text-background hover:opacity-90 gap-2 shadow-md shadow-black/25">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline text-[0.78rem] uppercase tracking-[0.12em] font-manrope">Tableau de bord</span>
                </Button>
              </motion.div>
            </Link>
          </div>

        </div>
      </div>
    </motion.nav>
  );
}

function RealHeroSection({ onScrollToSection }: { onScrollToSection?: () => void }) {
  return (
    // No background layers — SharedBackground is behind everything
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function Landing2() {
  const [cinematicDone, setCinematicDone] = useState(false);

  return (
    <div className="landing-theme theme-smooth overflow-x-hidden w-full min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Shared background — always mounted, never swapped */}
      <SharedBackground />

      {/* Phase 1 — text overlay, no own background */}
      {!cinematicDone && (
        <CinematicHero onComplete={() => setCinematicDone(true)} />
      )}

      {/* Phase 2 — real hero content animates in over the same background */}
      <AnimatePresence>
        {cinematicDone && (
          <motion.div
            key="real-hero"
            className="relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <RealNavbar />
            <RealHeroSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

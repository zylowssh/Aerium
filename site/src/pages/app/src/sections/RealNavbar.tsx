import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

const aeriumLogo = '/assets/aerium-logo.png';

interface RealNavbarProps {
  onScrollToSection?: () => void;
}

export default function RealNavbar({ onScrollToSection }: RealNavbarProps) {
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
      animate={{ y: 0, x: '-50%', opacity: 1 }}
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

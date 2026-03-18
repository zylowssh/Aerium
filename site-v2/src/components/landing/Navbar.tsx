import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Github, BarChart3, Moon, Sun, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import aeriumLogo from '@/assets/aerium-logo.png';

interface NavbarProps {
  onScrollToSection?: () => void;
}

const Navbar = ({ onScrollToSection }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className="fixed z-50 left-1/2"
      initial={{ y: -100, x: '-50%' }}
      animate={{
        y: 0,
        x: '-50%',
      }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        top: isScrolled ? '10px' : '14px',
        width: 'min(980px, calc(100vw - 16px))',
        transition: 'top 0.5s cubic-bezier(0.22, 1, 0.36, 1), width 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
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
          borderColor: isLight ? 'rgba(255,255,255,0.68)' : 'rgba(117, 180, 184, 0.35)',
          boxShadow: isScrolled
            ? '0 20px 45px rgba(0, 0, 0, 0.24)'
            : '0 14px 34px rgba(0, 0, 0, 0.18)',
          transition: 'box-shadow 0.35s ease',
        }}
      >
        <div
          className="px-3 sm:px-5 lg:px-7 flex items-center justify-between w-full h-[56px] sm:h-[64px] lg:h-[68px] gap-2 sm:gap-3"
        >
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={aeriumLogo}
                alt="Aerium"
                className="h-9 sm:h-10 w-auto drop-shadow-[0_10px_18px_rgba(0,0,0,0.3)] transition-all duration-300 group-hover:scale-105"
              />
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-base font-semibold text-foreground tracking-tight font-manrope">Aerium</span>
              </div>
            </Link>
          </motion.div>

          {/* Center Navigation Links */}
          <motion.div
            className="hidden md:flex items-center gap-1.5 rounded-full px-2 py-1 border border-white/40 dark:border-white/15 bg-white/35 dark:bg-black/30 shadow-inner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <button
              onClick={onScrollToSection}
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors rounded-full px-4 py-2 font-manrope hover:bg-white/40 dark:hover:bg-white/10"
            >
              Découvrir
            </button>
            <Link
              to="/dashboard"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors rounded-full px-4 py-2 font-manrope hover:bg-white/40 dark:hover:bg-white/10"
            >
              Dashboard
            </Link>
          </motion.div>

          {/* Right Actions */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              className="p-2.5 rounded-full border border-white/40 dark:border-white/20 bg-white/30 dark:bg-black/35 hover:bg-white/55 dark:hover:bg-black/55 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-foreground" />
              ) : (
                <Moon className="w-4 h-4 text-foreground" />
              )}
            </motion.button>

            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hidden sm:block">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full bg-white/25 hover:bg-white/45 dark:bg-black/25 dark:hover:bg-black/45">
                  <Github className="w-4 h-4" />
                </Button>
              </motion.div>
            </a>

            <Link to="/dashboard">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="sm"
                  className="h-9 rounded-full px-4 bg-foreground text-background hover:opacity-90 gap-2 shadow-md shadow-black/25"
                >
                  <Leaf className="w-4 h-4" />
                  <span className="hidden sm:inline text-[0.78rem] uppercase tracking-[0.12em] font-manrope">Explorer</span>
                  <BarChart3 className="w-4 h-4 sm:hidden" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;

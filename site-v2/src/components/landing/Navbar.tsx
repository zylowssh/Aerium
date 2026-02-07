import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Github, BarChart3, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import aeriumLogo from '@/assets/aerium-logo.png';

interface NavbarProps {
  onScrollToSection?: () => void;
}

const Navbar = ({ onScrollToSection }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
        top: isScrolled ? '16px' : '0px',
        width: isScrolled ? 'min(800px, calc(100vw - 32px))' : '100%',
        transition: 'top 0.5s cubic-bezier(0.22, 1, 0.36, 1), width 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        className="w-full h-full overflow-hidden"
        style={{
          borderRadius: isScrolled ? '9999px' : '0px',
          backgroundColor: isScrolled 
            ? 'hsl(var(--background) / 0.85)' 
            : 'transparent',
          backdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none',
          border: isScrolled ? '1px solid hsl(var(--border) / 0.4)' : 'none',
          boxShadow: isScrolled 
            ? '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)' 
            : 'none',
          /* transition: 'border-radius 0.5s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.4s ease, backdrop-filter 0.4s ease, border 0.4s ease, box-shadow 0.4s ease', */
        }}
      >
        <div 
          className="px-6 lg:px-8 flex items-center justify-between w-full transition-all duration-500"
          style={{ height: isScrolled ? '56px' : '72px' }}
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
                className="h-10 w-auto shadow-lg transition-all duration-300 group-hover:scale-105"
              />
              <span className="text-xl font-bold text-foreground tracking-tight">Aerium</span>
            </Link>
          </motion.div>

          {/* Center Navigation Links */}
          <motion.div
            className="hidden md:flex items-center gap-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <button
              onClick={onScrollToSection}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              Découvrir
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </button>
            <Link
              to="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              Dashboard
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </Link>
          </motion.div>

          {/* Right Actions */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
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
                <Button variant="ghost" size="sm" className="gap-2 rounded-full">
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
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground gap-2 rounded-full shadow-lg shadow-primary/25"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Accéder</span>
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

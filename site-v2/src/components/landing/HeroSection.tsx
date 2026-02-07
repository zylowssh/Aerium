import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Code2, Zap, Activity, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

const techStack = [
  { name: 'React + TypeScript', icon: Code2 },
  { name: 'Python (Flask)', icon: Terminal },
  { name: 'Temps Réel', icon: Zap },
  { name: 'IoT Sensors', icon: Activity }
];

interface HeroSectionProps {
  onScrollToSection?: () => void;
}

const HeroSection = ({ onScrollToSection }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen pt-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px hsl(var(--primary) / 0.3)" }}
          >
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Projet de Surveillance de la Qualité de l'Air
          </motion.div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold text-foreground mb-8 leading-tight tracking-tight">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            >
              <span className="block mb-2">Surveillez l'Air</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">
                en Temps Réel
              </span>
            </motion.div>
          </h1>

          {/* Description */}
          <motion.p
            className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            Un dashboard interactif pour monitorer la qualité de l'air avec des capteurs IoT,
            des analyses avancées et des alertes intelligentes en temps réel.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <Link to="/dashboard">
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px hsl(var(--primary) / 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="gradient-primary text-primary-foreground px-8 h-12 text-base font-medium shadow-lg shadow-primary/25 rounded-full"
                >
                  Explorer le Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </Link>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Button
                size="lg"
                variant="outline"
                className="px-8 h-12 text-base font-medium rounded-full border-2 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
                onClick={onScrollToSection}
              >
                En Savoir Plus
              </Button>
            </motion.div>
          </motion.div>

          {/* Tech Stack Pills */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-3 mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            {techStack.map((tech, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-border/50 text-sm font-medium text-foreground hover:border-primary/50 transition-all duration-300 group cursor-pointer shadow-md hover:shadow-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <tech.icon className="w-4 h-4 text-primary group-hover:text-primary/80 transition-colors" />
                <span>{tech.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <motion.button
            onClick={onScrollToSection}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-xs font-medium tracking-wider uppercase">Scroll to explore</span>
            <motion.div
              className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-1 group-hover:border-primary/60 transition-colors"
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div className="w-1 h-2 bg-primary rounded-full" />
            </motion.div>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

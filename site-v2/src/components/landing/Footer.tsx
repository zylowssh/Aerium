import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Zap } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border bg-card/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="grid md:grid-cols-3 gap-12 mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Brand */}
          <motion.div whileHover={{ y: -2 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground text-lg">Aerium</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Plateforme de surveillance de qualité de l'air en temps réel avec IA.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div>
            <h4 className="font-semibold text-foreground mb-4">Accès Rapide</h4>
            <div className="space-y-2">
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group">
                <span className="group-hover:translate-x-1 transition-transform">→</span>
                Dashboard
              </Link>
              <Link to="/sensors" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group">
                <span className="group-hover:translate-x-1 transition-transform">→</span>
                Capteurs
              </Link>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group">
                <span className="group-hover:translate-x-1 transition-transform">→</span>
                GitHub
              </a>
            </div>
          </motion.div>

          {/* Legal */}
          <motion.div>
            <h4 className="font-semibold text-foreground mb-4">Information</h4>
            <p className="text-sm text-muted-foreground mb-3">
              © 2026 Aerium - Projet de Surveillance de la Qualité de l'Air
            </p>
            <div className="flex gap-4">
              <motion.a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center hover:border-primary/50 transition-colors"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Github className="w-5 h-5 text-muted-foreground" />
              </motion.a>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p>Conçu avec <span className="text-primary">❤</span> pour améliorer la qualité de l'air</p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import aeriumLogo from '@/assets/aerium-logo.png';
import footerDarkImage from '@/assets/landing/footer-dark.png';
import footerLightImage from '@/assets/landing/footer-light.png';

const footerColumns = [
  {
    title: 'Plateforme',
    links: [
      { label: 'Accueil', to: '/' },
      { label: 'Connexion', to: '/auth' },
      { label: 'Tableau de bord', to: '/dashboard' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Documentation', href: 'https://github.com/zylowssh/Aerium/tree/main/docs' },
      { label: 'Guide utilisateur', href: 'https://github.com/zylowssh/Aerium/blob/main/docs/GUIDE-UTILISATEUR.md' },
      { label: 'Dépôt GitHub', href: 'https://github.com/zylowssh/Aerium' },
    ],
  },
];

export default function FooterSection() {
  return (
    <footer className="relative z-10 min-h-screen overflow-hidden">
      <motion.div
        className="relative min-h-screen overflow-hidden"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <img
          src={footerLightImage}
          alt="Paysage naturel en pied de page"
          className="absolute inset-0 h-full w-full object-cover object-[center_5%] transition-all duration-1000 ease-out will-change-[opacity,transform,filter] motion-reduce:transition-none opacity-100 dark:opacity-0 scale-100 dark:scale-[1.02] blur-0 dark:blur-[4px] brightness-100 dark:brightness-75"
          loading="lazy"
        />
        <img
          src={footerDarkImage}
          alt="Paysage naturel en pied de page (mode sombre)"
          className="absolute inset-0 h-full w-full object-cover object-[center_0%] transition-all duration-1000 ease-out will-change-[opacity,transform,filter] motion-reduce:transition-none opacity-0 dark:opacity-100 scale-[1.02] dark:scale-100 blur-[4px] dark:blur-0 brightness-125 dark:brightness-100"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-slate-950/60" />

        <div className="relative z-20 min-h-screen flex flex-col justify-start">
          <div className="px-4 sm:px-8 lg:px-12 pt-36 pb-8 sm:pb-10 lg:pb-11">
            <div className="grid gap-8 sm:gap-10 lg:grid-cols-[0.9fr_2.1fr] items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <img src={aeriumLogo} alt="Aerium" className="h-8 w-auto" />
                  <span className="text-[2rem] sm:text-[2.1rem] font-manrope font-semibold text-white leading-none">Aerium</span>
                </div>
                <p className="text-sm text-white/50 font-manrope">
                  Qualité de l'air, rendue visible.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
                {footerColumns.map((column) => (
                  <div key={column.title}>
                    <h4 className="font-manrope font-semibold text-base sm:text-lg lg:text-[1.4rem] leading-none text-white mb-3">
                      {column.title}
                    </h4>
                    <ul className="space-y-2.5">
                      {column.links.map((link) => (
                        <li key={link.label}>
                          {'to' in link ? (
                            <Link to={link.to} className="text-sm sm:text-base text-white/65 hover:text-white transition-colors font-manrope">
                              {link.label}
                            </Link>
                          ) : (
                            <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm sm:text-base text-white/65 hover:text-white transition-colors font-manrope">
                              {link.label}
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-16 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-white/40 font-manrope">
                © 2026 Aerium
              </p>
              <p className="text-sm text-white/40 font-manrope">
                Qualité de l'air, rendue visible.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}

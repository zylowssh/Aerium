import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpenText, Github, ShieldCheck } from 'lucide-react';
import footerDarkImage from '@/assets/landing/footer-dark.png';
import footerLightImage from '@/assets/landing/footer-light.png';
import aeriumLogo from '@/assets/aerium-logo.png';

const footerColumns = [
  {
    title: 'Plateforme',
    links: [
      { label: 'Accueil', to: '/' },
      { label: 'Connexion', to: '/auth' },
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Analytics', to: '/analytics' },
    ],
  },
  {
    title: 'Surveillance',
    links: [
      { label: 'Capteurs', to: '/sensors' },
      { label: 'Carte des capteurs', to: '/sensor-map' },
      { label: 'Alertes', to: '/alerts' },
      { label: 'Rapports', to: '/reports' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Repository GitHub', href: 'https://github.com/zylowssh/Aerium' },
      { label: 'Documentation site-v2', href: 'https://github.com/zylowssh/Aerium/tree/main/site-v2/docs' },
      { label: 'Guide de demarrage', href: 'https://github.com/zylowssh/Aerium/blob/main/site-v2/docs/fr/QUICKSTART.md' },
    ],
  },
  {
    title: 'Juridique',
    links: [
      { label: 'Licence MIT', href: 'https://github.com/zylowssh/Aerium/blob/main/LICENSE' },
      { label: 'Code source', href: 'https://github.com/zylowssh/Aerium' },
      { label: 'Signaler un probleme', href: 'https://github.com/zylowssh/Aerium/issues' },
    ],
  },
];

const socialLinks = [
  { label: 'GitHub', href: 'https://github.com/zylowssh/Aerium', icon: Github },
  { label: 'Documentation', href: 'https://github.com/zylowssh/Aerium/tree/main/site-v2/docs', icon: BookOpenText },
  { label: 'Issues', href: 'https://github.com/zylowssh/Aerium/issues', icon: ShieldCheck },
];

const Footer = () => {
  return (
    <footer className="theme-smooth relative min-h-screen overflow-hidden">
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
          className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-1000 ease-out will-change-[opacity,transform,filter] motion-reduce:transition-none opacity-100 dark:opacity-0 scale-100 dark:scale-[1.02] blur-0 dark:blur-[4px] brightness-100 dark:brightness-75"
          loading="lazy"
        />
        <img
          src={footerDarkImage}
          alt="Paysage naturel en pied de page (mode sombre)"
          className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-1000 ease-out will-change-[opacity,transform,filter] motion-reduce:transition-none opacity-0 dark:opacity-100 scale-[1.02] dark:scale-100 blur-[4px] dark:blur-0 brightness-125 dark:brightness-100"
          loading="lazy"
        />

        <div className="relative z-20 min-h-screen flex flex-col justify-start">
          <div className="px-4 sm:px-8 lg:px-12 pt-6 pb-8 sm:pt-8 sm:pb-10 lg:pt-20 lg:pb-11">
            <div className="grid gap-8 sm:gap-10 lg:grid-cols-[0.9fr_2.1fr] items-start">
              <div>
                <div className="flex items-center gap-3">
                  <img src={aeriumLogo} alt="Aerium" className="h-8 w-auto" />
                  <span className="text-[2rem] sm:text-[2.1rem] font-manrope font-semibold text-foreground leading-none">Aerium</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
                {footerColumns.map((column) => (
                  <div key={column.title}>
                    <h4 className="font-manrope font-semibold text-base sm:text-lg lg:text-[1.4rem] leading-none text-foreground mb-3">{column.title}</h4>
                    <ul className="space-y-2.5">
                      {column.links.map((link) => (
                        <li key={link.label}>
                          {'to' in link ? (
                            <Link to={link.to} className="text-sm sm:text-base text-foreground/65 hover:text-foreground transition-colors font-manrope">
                              {link.label}
                            </Link>
                          ) : (
                            <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm sm:text-base text-foreground/65 hover:text-foreground transition-colors font-manrope">
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

            <div className="my-8 sm:my-9 border-t border-black/24 dark:border-white/20" />

            <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
              <div>
                <h3 className="text-[clamp(1.5rem,4vw,2rem)] font-manrope font-semibold leading-[1.1] text-foreground max-w-xl mb-3">
                  Une qualite de l'air plus saine, mesuree en continu
                </h3>
                <p className="text-[1.08rem] max-w-lg leading-relaxed text-foreground/70 font-manrope">
                  Aerium centralise les mesures CO2, temperature et humidite pour aider les equipes a agir plus vite, avec des donnees claires et des alertes fiables.
                </p>
              </div>

              <div className="lg:justify-self-end">
                <h3 className="text-[clamp(1.3rem,3vw,2rem)] font-manrope font-semibold text-foreground mb-4 leading-none">
                  Liens utiles
                </h3>
                <div className="flex items-center gap-3 sm:gap-4 text-foreground">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="text-foreground/90 hover:text-foreground transition-colors"
                    >
                      <social.icon className="w-[1.8rem] h-[1.8rem]" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;

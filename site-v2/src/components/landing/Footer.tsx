import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Facebook, Github, Instagram, Twitter } from 'lucide-react';
import footerDarkImage from '@/assets/landing/footer-dark.png';
import footerLightImage from '@/assets/landing/footer-light.png';
import aeriumLogo from '@/assets/aerium-logo.png';

const footerColumns = [
  {
    title: 'Main',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Early Access', to: '/dashboard' },
      { label: 'Projects', to: '/sensors' },
      { label: 'Blog', href: 'https://github.com' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: 'https://github.com' },
      { label: 'Careers', href: 'https://github.com' },
      { label: 'Sustainability', href: 'https://github.com' },
    ],
  },
  {
    title: 'Application',
    links: [
      { label: 'Download for iOS', href: 'https://github.com' },
      { label: 'Download for Android', href: 'https://github.com' },
    ],
  },
  {
    title: 'Legal Pages',
    links: [
      { label: 'Privacy Policy', href: 'https://github.com' },
      { label: 'Terms & Conditions', href: 'https://github.com' },
      { label: 'Cookie Policy', href: 'https://github.com' },
    ],
  },
];

const socialLinks = [
  { label: 'GitHub', href: 'https://github.com', icon: Github },
  { label: 'Facebook', href: 'https://facebook.com', icon: Facebook },
  { label: 'Instagram', href: 'https://instagram.com', icon: Instagram },
  { label: 'X (Twitter)', href: 'https://x.com', icon: Twitter },
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
          className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform,filter] motion-reduce:transition-none opacity-100 dark:opacity-0 scale-100 dark:scale-[1.02] blur-0 dark:blur-[4px] brightness-100 dark:brightness-75"
          loading="lazy"
        />
        <img
          src={footerDarkImage}
          alt="Paysage naturel en pied de page (mode sombre)"
          className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform,filter] motion-reduce:transition-none opacity-0 dark:opacity-100 scale-[1.02] dark:scale-100 blur-[4px] dark:blur-0 brightness-125 dark:brightness-100"
          loading="lazy"
        />

        <div className="relative z-20 min-h-screen flex flex-col justify-start">
          <div className="px-6 sm:px-10 lg:px-12 pt-6 pb-8 sm:pt-8 sm:pb-10 lg:pt-40 lg:pb-11">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_2.1fr] items-start">
              <div>
                <div className="flex items-center gap-3">
                  <img src={aeriumLogo} alt="Aerium" className="h-8 w-auto" />
                  <span className="text-[2rem] sm:text-[2.1rem] font-manrope font-semibold text-foreground leading-none">Aerium</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10">
                {footerColumns.map((column) => (
                  <div key={column.title}>
                    <h4 className="font-manrope font-semibold text-[1.9rem] leading-none text-foreground mb-3">{column.title}</h4>
                    <ul className="space-y-2.5">
                      {column.links.map((link) => (
                        <li key={link.label}>
                          {'to' in link ? (
                            <Link to={link.to} className="text-[1.06rem] text-foreground/65 hover:text-foreground transition-colors font-manrope">
                              {link.label}
                            </Link>
                          ) : (
                            <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-[1.06rem] text-foreground/65 hover:text-foreground transition-colors font-manrope">
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

            <div className="grid gap-8 lg:gap-x-[40rem] lg:gap-y-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
              <div>
                <h3 className="text-[clamp(2.2rem,4.1vw,3.45rem)] font-manrope font-semibold leading-[1.05] text-foreground max-w-xl mb-3">
                  Sustainability for the upcoming generation
                </h3>
                <p className="text-[1.08rem] max-w-lg leading-relaxed text-foreground/70 font-manrope">
                  Designing systems, products and environments that protect our planet while empowering future generations to thrive.
                </p>
              </div>

              <div className="lg:justify-self-start">
                <h3 className="text-[clamp(2rem,3.1vw,2.65rem)] font-manrope font-semibold text-foreground mb-4 leading-none">
                  Socials
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

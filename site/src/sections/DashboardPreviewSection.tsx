import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Bell, Clock3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

import dashboardPreviewImage from '@/assets/landing/dashboard-preview.jpg';

const bulletPoints = [
  { icon: Activity, label: 'Graphiques temps réel' },
  { icon: Bell, label: 'Alertes par criticité' },
  { icon: Clock3, label: 'Historique complet' },
  { icon: Download, label: 'Export de rapports' },
];

export default function DashboardPreviewSection() {
  return (
    <section className="relative z-10 py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-manrope uppercase tracking-[0.2em] text-cyan-400/80 text-xs mb-4">
              Tableau de bord
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl text-white mb-6 leading-tight">
              <span className="block font-manrope font-semibold">Vos données,</span>
              <span className="block font-editorial italic text-cyan-300/90">immédiatement lisibles.</span>
            </h2>
            <p className="text-lg text-white/60 mb-8 leading-relaxed max-w-lg">
              Pas de courbes indéchiffrables ni de tableaux bruts. Aerium présente votre qualité de l'air comme un récit clair, avec des alertes prioritaires et des tendances visuelles.
            </p>

            <ul className="space-y-3 mb-8">
              {bulletPoints.map((point, index) => (
                <motion.li
                  key={index}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                >
                  <motion.span
                    className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center"
                    initial={{ scale: 0.8 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                  >
                    <point.icon className="w-4 h-4 text-emerald-300" />
                  </motion.span>
                  <span className="text-white/80 font-manrope text-sm">{point.label}</span>
                </motion.li>
              ))}
            </ul>

            <Link to="/dashboard">
              <Button size="lg" className="h-12 sm:h-14 px-7 rounded-full bg-white text-slate-900 hover:bg-white/90 font-manrope font-semibold">
                Explorer le tableau de bord
              </Button>
            </Link>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="absolute inset-0 -m-8 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(52,211,153,0.15), transparent 60%)',
              }}
            />

            <div className="relative rounded-[2rem] border border-white/15 bg-slate-950/70 backdrop-blur-xl p-3 sm:p-4 overflow-hidden">
              <motion.img
                src={dashboardPreviewImage}
                alt="Aperçu du tableau de bord Aerium"
                className="w-full rounded-xl object-cover"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.3 }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import { useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SharedBackground from '@/sections/SharedBackground';
import CinematicHero from '@/sections/CinematicHero';
import RealNavbar from '@/sections/RealNavbar';
import HeroSection from '@/sections/HeroSection';
import MissionSection from '@/sections/MissionSection';
import FeaturesSection from '@/sections/FeaturesSection';
import HowItWorksSection from '@/sections/HowItWorksSection';
import DashboardPreviewSection from '@/sections/DashboardPreviewSection';
import UseCasesSection from '@/sections/UseCasesSection';
import CTASection from '@/sections/CTASection';
import FooterSection from '@/sections/FooterSection';

export default function Landing5() {
  const [cinematicDone, setCinematicDone] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = useCallback(() => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="landing-theme theme-smooth overflow-x-hidden w-full min-h-screen">
      {/* Shared background — always mounted, never swapped */}
      <SharedBackground />

      {/* Phase 1 — cinematic text overlay */}
      {!cinematicDone && (
        <CinematicHero onComplete={() => setCinematicDone(true)} />
      )}

      {/* Phase 2 — real page content */}
      <AnimatePresence>
        {cinematicDone && (
          <motion.div
            key="real-page"
            className="relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <RealNavbar onScrollToSection={scrollToFeatures} />
            <HeroSection onScrollToSection={scrollToFeatures} />

            <div ref={featuresRef}>
              <MissionSection />
              <FeaturesSection />
              <HowItWorksSection />
              <DashboardPreviewSection />
              <UseCasesSection />
              <CTASection />
            </div>

            <FooterSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

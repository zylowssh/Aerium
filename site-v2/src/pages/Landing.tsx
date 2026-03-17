import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import UseCasesSection from '@/components/landing/UseCasesSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

const VideoSection = lazy(() => import('@/components/landing/VideoSection'));

const Landing = () => {
  const videoRef = useRef<HTMLDivElement>(null);
  const [shouldLoadVideoSection, setShouldLoadVideoSection] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadVideoSection(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px 0px' }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const scrollToVideo = () => {
    if (videoRef.current) {
      const navbarHeight = 0;
      const elementPosition = videoRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navbarHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="landing-theme min-h-screen bg-background overflow-x-hidden">
      <Navbar onScrollToSection={scrollToVideo} />
      
      <HeroSection onScrollToSection={scrollToVideo} />
      
      <div ref={videoRef}>
        {shouldLoadVideoSection ? (
          <Suspense fallback={<div className="min-h-[420px] flex items-center justify-center text-muted-foreground">Chargement de la section video...</div>}>
            <VideoSection />
          </Suspense>
        ) : (
          <div className="min-h-[420px] flex items-center justify-center text-muted-foreground">Video chargee a l'approche de la section...</div>
        )}
      </div>
      
      <FeaturesSection />
      
      <HowItWorksSection />
      
      <UseCasesSection />
      
      <CTASection />
      
      <Footer />
    </div>
  );
};

export default Landing;

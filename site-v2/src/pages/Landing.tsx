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
  const footerRef = useRef<HTMLElement>(null);
  const [shouldLoadVideoSection, setShouldLoadVideoSection] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);

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

  useEffect(() => {
    if (!footerRef.current) {
      return;
    }

    const updateFooterHeight = () => {
      if (footerRef.current) {
        setFooterHeight(footerRef.current.offsetHeight);
      }
    };

    updateFooterHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateFooterHeight();
    });

    resizeObserver.observe(footerRef.current);
    window.addEventListener('resize', updateFooterHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateFooterHeight);
    };
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
    <div className="landing-theme theme-smooth min-h-screen bg-background overflow-x-clip relative">
      <div className="relative z-10 bg-background">
        <Navbar onScrollToSection={scrollToVideo} />
        
        <HeroSection onScrollToSection={scrollToVideo} />

        <div ref={videoRef}>
          {shouldLoadVideoSection ? (
            <Suspense fallback={<div className="min-h-[420px] flex items-center justify-center text-muted-foreground">Chargement de la section vidéo...</div>}>
              <VideoSection />
            </Suspense>
          ) : (
            <div className="min-h-[420px] flex items-center justify-center text-muted-foreground">Vidéo chargée à l'approche de la section...</div>
          )}
        </div>

        <FeaturesSection />

        <HowItWorksSection />

        <UseCasesSection />

        <CTASection />
      </div>

      <div className="relative z-0" style={{ height: footerHeight > 0 ? `${footerHeight}px` : '100vh' }} />

      <Footer ref={footerRef} className="fixed inset-x-0 bottom-0 z-0" />
    </div>
  );
};

export default Landing;

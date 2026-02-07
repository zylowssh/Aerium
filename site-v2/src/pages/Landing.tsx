import { useRef } from 'react';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import VideoSection from '@/components/landing/VideoSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import UseCasesSection from '@/components/landing/UseCasesSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

const Landing = () => {
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = () => {
    if (featuresRef.current) {
      const navbarHeight = 100;
      const elementPosition = featuresRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navbarHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar onScrollToSection={scrollToFeatures} />
      
      <HeroSection onScrollToSection={scrollToFeatures} />
      
      <VideoSection />
      
      <div ref={featuresRef}>
        <FeaturesSection />
      </div>
      
      <HowItWorksSection />
      
      <UseCasesSection />
      
      <CTASection />
      
      <Footer />
    </div>
  );
};

export default Landing;

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-[100] transition-all duration-300',
        isScrolled
          ? 'bg-[#F6F7F9]/90 backdrop-blur-md py-4'
          : 'bg-transparent py-6'
      )}
    >
      <div className="w-full px-[6vw] flex items-center justify-between">
        {/* Logo */}
        <span className="mono-label text-[#0B0C10]">AERIUM</span>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection('features')}
            className="text-sm font-medium text-[#0B0C10]/70 hover:text-[#0B0C10] transition-colors"
          >
            Product
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="text-sm font-medium text-[#0B0C10]/70 hover:text-[#0B0C10] transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('testimonials')}
            className="text-sm font-medium text-[#0B0C10]/70 hover:text-[#0B0C10] transition-colors"
          >
            Reviews
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            className="text-sm font-medium text-[#0B0C10]/70 hover:text-[#0B0C10] transition-colors"
          >
            Support
          </button>
        </div>

        {/* CTA */}
        <button
          onClick={() => scrollToSection('pricing')}
          className="btn-primary text-sm"
        >
          Pre-order
        </button>
      </div>
    </nav>
  );
}

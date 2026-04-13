import { useRef, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, ArrowRight, Mail, Shield, Truck, Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

gsap.registerPlugin(ScrollTrigger);

const features = [
  { label: 'Free shipping', icon: Truck },
  { label: '2-year warranty', icon: Shield },
  { label: 'App access included', icon: Smartphone },
];

export default function PricingSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({ title: '', message: '' });

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const card = cardRef.current;
    const footer = footerRef.current;

    if (!section || !header || !card || !footer) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        header,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: header,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Card animation
      gsap.fromTo(
        card,
        { y: 60, scale: 0.98, opacity: 0 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Footer links stagger
      const footerLinks = footer.querySelectorAll('.footer-link');
      gsap.fromTo(
        footerLinks,
        { y: 12, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footer,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const handlePreOrder = () => {
    setDialogContent({
      title: 'Pre-order Coming Soon',
      message: 'Thank you for your interest in Aerium! Pre-orders will open soon. Sign up for our newsletter to be the first to know.',
    });
    setDialogOpen(true);
  };

  const handleContactSales = () => {
    setDialogContent({
      title: 'Contact Sales',
      message: 'For fleet orders and enterprise inquiries, please email us at sales@aerium.io. We\'ll get back to you within 24 hours.',
    });
    setDialogOpen(true);
  };

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="relative bg-[#F6F7F9] py-24 md:py-32"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B0C10] mb-4">
            Pre-order Aerium
          </h2>
          <p className="subheadline text-secondary-light mx-auto">
            Ships early next quarter. 30-day returns if it's not a fit.
          </p>
        </div>

        {/* Pricing Card */}
        <div ref={cardRef} className="flex justify-center mb-20">
          <div className="card-white w-full max-w-md p-8 md:p-10">
            <div className="text-center mb-8">
              <h3 className="font-display text-xl font-semibold text-[#0B0C10] mb-2">
                Aerium Sensor + App
              </h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-display text-5xl font-bold text-[#0B0C10]">
                  $149
                </span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {features.map((feature) => (
                <li
                  key={feature.label}
                  className="flex items-center gap-3 text-[#0B0C10]"
                >
                  <div className="w-5 h-5 rounded-full bg-[#2F6BFF]/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-[#2F6BFF]" />
                  </div>
                  <feature.icon className="w-4 h-4 text-[#6B7280]" />
                  <span className="text-sm">{feature.label}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handlePreOrder}
              className="btn-primary w-full mb-4"
            >
              Pre-order now
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>

            <button
              onClick={handleContactSales}
              className="btn-secondary w-full text-[#0B0C10]/70 text-sm"
            >
              <Mail className="mr-2 w-4 h-4" />
              Need a fleet? Contact sales
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer ref={footerRef} className="border-t border-[#E5E7EB] pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <button
                onClick={() => {
                  setDialogContent({
                    title: 'Privacy Policy',
                    message: 'We take your privacy seriously. All data is encrypted and stored securely. You have full control over your data and can export or delete it at any time.',
                  });
                  setDialogOpen(true);
                }}
                className="footer-link text-sm text-[#6B7280] hover:text-[#0B0C10] transition-colors"
              >
                Privacy
              </button>
              <button
                onClick={() => {
                  setDialogContent({
                    title: 'Terms of Service',
                    message: 'By using Aerium, you agree to our terms of service. We provide a 30-day money-back guarantee and a 2-year warranty on all hardware.',
                  });
                  setDialogOpen(true);
                }}
                className="footer-link text-sm text-[#6B7280] hover:text-[#0B0C10] transition-colors"
              >
                Terms
              </button>
              <button
                onClick={() => {
                  setDialogContent({
                    title: 'Support',
                    message: 'Our support team is available 24/7. Reach out to us at support@aerium.io or through our live chat.',
                  });
                  setDialogOpen(true);
                }}
                className="footer-link text-sm text-[#6B7280] hover:text-[#0B0C10] transition-colors"
              >
                Support
              </button>
            </div>
            <span className="mono-label text-[#6B7280]">
              © 2026 Aerium
            </span>
          </div>
        </footer>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{dialogContent.title}</DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              {dialogContent.message}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </section>
  );
}

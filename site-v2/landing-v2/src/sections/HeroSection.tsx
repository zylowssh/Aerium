import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import PinnedSection from './PinnedSection';
import SensorDisc from './SensorDisc';
import { Play, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const circle = circleRef.current;
    const disc = discRef.current;
    const headline = headlineRef.current;
    const subhead = subheadRef.current;
    const cta = ctaRef.current;

    if (!section || !circle || !disc || !headline || !subhead || !cta) return;

    const ctx = gsap.context(() => {
      // Auto-play entrance animation on load
      const loadTl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      // Circle entrance
      loadTl.fromTo(
        circle,
        { scale: 0.85, opacity: 0, y: 40 },
        { scale: 1, opacity: 1, y: 0, duration: 0.9 },
        0
      );

      // Disc entrance
      loadTl.fromTo(
        disc,
        { scale: 0.6, opacity: 0, rotate: -8 },
        { scale: 1, opacity: 1, rotate: 0, duration: 0.7, ease: 'back.out(1.6)' },
        0.15
      );

      // Headline lines stagger
      const headlineLines = headline.querySelectorAll('.headline-line');
      loadTl.fromTo(
        headlineLines,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.08 },
        0.3
      );

      // Subheadline
      loadTl.fromTo(
        subhead,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        0.5
      );

      // CTA
      loadTl.fromTo(
        cta,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        0.6
      );

      // Scroll-driven exit animation
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
          onLeaveBack: () => {
            // Reset all elements to visible when scrolling back to top
            gsap.set([circle, disc, headlineLines, subhead, cta], {
              opacity: 1,
              y: 0,
              scale: 1,
            });
          },
        },
      });

      // EXIT phase (70% - 100%)
      scrollTl.fromTo(
        circle,
        { y: 0, scale: 1, opacity: 1 },
        { y: '-22vh', scale: 0.92, opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        disc,
        { y: 0, opacity: 1 },
        { y: '-10vh', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        headlineLines,
        { y: 0, opacity: 1 },
        { y: '10vh', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        subhead,
        { y: 0, opacity: 1 },
        { y: '8vh', opacity: 0, ease: 'power2.in' },
        0.72
      );

      scrollTl.fromTo(
        cta,
        { y: 0, opacity: 1 },
        { y: '8vh', opacity: 0, ease: 'power2.in' },
        0.74
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const scrollToFeatures = () => {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <PinnedSection ref={sectionRef} zIndex={10}>
      {/* Central Media Circle */}
      <div
        ref={circleRef}
        className="media-circle absolute will-change-transform"
        style={{
          width: 'min(52vw, 720px)',
          height: 'min(52vw, 720px)',
          left: '50%',
          top: '48%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <img
          src="/hero_air_purifier.jpg"
          alt="Aerium Air Quality Monitor"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Sensor Disc */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '44%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <SensorDisc ref={discRef} size="lg" />
      </div>

      {/* Headline */}
      <div
        ref={headlineRef}
        className="absolute text-center will-change-transform"
        style={{ top: '74%', left: '50%', transform: 'translateX(-50%)' }}
      >
        <div className="headline-large text-[#0B0C10]">
          <div className="headline-line">BREATHE</div>
          <div className="headline-line">SMARTER</div>
          <div className="headline-line text-secondary-light text-[0.7em]">
            MONITOR CLEANER
          </div>
        </div>
      </div>

      {/* Subheadline */}
      <p
        ref={subheadRef}
        className="subheadline absolute text-center text-secondary-light will-change-transform"
        style={{ top: '88%', left: '50%', transform: 'translateX(-50%)' }}
      >
        Aerium tracks CO₂, humidity, and temperature in real time—so your spaces
        stay healthy, focused, and energy-efficient.
      </p>

      {/* CTA Row */}
      <div
        ref={ctaRef}
        className="absolute flex items-center gap-4 will-change-transform"
        style={{ top: '95%', left: '50%', transform: 'translateX(-50%)' }}
      >
        <button onClick={scrollToFeatures} className="btn-primary">
          See features
          <ArrowRight className="ml-2 w-4 h-4" />
        </button>
        <button className="btn-secondary text-[#0B0C10]/70">
          <Play className="mr-2 w-4 h-4" />
          Watch video
        </button>
      </div>
    </PinnedSection>
  );
}

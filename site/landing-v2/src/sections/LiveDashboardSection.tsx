import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import PinnedSection from './PinnedSection';
import SensorDisc from './SensorDisc';
import { ArrowRight, ExternalLink } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function LiveDashboardSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const circle = circleRef.current;
    const disc = discRef.current;
    const headline = headlineRef.current;
    const subhead = subheadRef.current;
    const cta = ctaRef.current;
    const overlay = overlayRef.current;

    if (!section || !circle || !disc || !headline || !subhead || !cta || !overlay) return;

    const headlineLines = headline.querySelectorAll('.headline-line');

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        },
      });

      // ENTRANCE (0% - 30%)
      scrollTl.fromTo(
        circle,
        { x: '60vw', scale: 0.85, opacity: 0 },
        { x: 0, scale: 1, opacity: 1, ease: 'power2.out' },
        0
      );

      scrollTl.fromTo(
        disc,
        { y: '-40vh', scale: 0.7, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, ease: 'power2.out' },
        0
      );

      scrollTl.fromTo(
        headlineLines,
        { y: '18vh', opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.02, ease: 'power2.out' },
        0.05
      );

      scrollTl.fromTo(
        subhead,
        { y: '10vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'power2.out' },
        0.1
      );

      scrollTl.fromTo(
        cta,
        { y: '10vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'power2.out' },
        0.15
      );

      // SETTLE (30% - 70%) - elements hold position

      // EXIT (70% - 100%)
      scrollTl.fromTo(
        circle,
        { x: 0, scale: 1, opacity: 1 },
        { x: '-55vw', scale: 0.92, opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        disc,
        { y: 0, opacity: 1 },
        { y: '-18vh', opacity: 0, ease: 'power2.in' },
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

      // Darken overlay for transition to dark section
      scrollTl.fromTo(
        overlay,
        { opacity: 0 },
        { opacity: 0.15, ease: 'power2.out' },
        0.78
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <PinnedSection ref={sectionRef} zIndex={20} id="features">
      {/* Transition overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black pointer-events-none opacity-0"
      />

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
          src="/dashboard_ui_light.jpg"
          alt="Aerium Live Dashboard"
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
          <div className="headline-line">LIVE</div>
          <div className="headline-line">DASHBOARD</div>
          <div className="headline-line text-secondary-light text-[0.7em]">
            REAL-TIME DATA
          </div>
        </div>
      </div>

      {/* Subheadline */}
      <p
        ref={subheadRef}
        className="subheadline absolute text-center text-secondary-light will-change-transform"
        style={{ top: '88%', left: '50%', transform: 'translateX(-50%)' }}
      >
        See CO₂, humidity, and temperature at a glance. Get alerts before air
        quality dips—so you can act in seconds.
      </p>

      {/* CTA Row */}
      <div
        ref={ctaRef}
        className="absolute flex items-center gap-4 will-change-transform"
        style={{ top: '95%', left: '50%', transform: 'translateX(-50%)' }}
      >
        <button className="btn-primary">
          Explore features
          <ArrowRight className="ml-2 w-4 h-4" />
        </button>
        <button className="btn-secondary text-[#0B0C10]/70">
          <ExternalLink className="mr-2 w-4 h-4" />
          View demo
        </button>
      </div>
    </PinnedSection>
  );
}

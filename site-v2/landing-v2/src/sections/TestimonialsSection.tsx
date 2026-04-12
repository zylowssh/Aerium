import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Quote, Building2, Home, School, FlaskConical, Palette } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    quote:
      "We adjusted our ventilation schedule and saw an immediate lift in focus.",
    author: 'Facilities Lead',
    company: 'Creative Studio',
    icon: Palette,
  },
  {
    quote:
      "Aerium gave us the data we needed to back up our HVAC upgrade.",
    author: 'Operations Manager',
    company: 'School District',
    icon: School,
  },
  {
    quote:
      "Simple, calm UI—exactly what we wanted for our workspace.",
    author: 'Studio Director',
    company: 'Design Agency',
    icon: Building2,
  },
];

const useCases = [
  { label: 'Offices', icon: Building2 },
  { label: 'Studios', icon: Palette },
  { label: 'Schools', icon: School },
  { label: 'Labs', icon: FlaskConical },
  { label: 'Homes', icon: Home },
];

export default function TestimonialsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const logosRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const logos = logosRef.current;
    const cards = cardsRef.current;
    const chips = chipsRef.current;

    if (!section || !header || !logos || !cards || !chips) return;

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

      // Logos stagger
      const logoItems = logos.querySelectorAll('.logo-item');
      gsap.fromTo(
        logoItems,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: logos,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Cards with offset animation
      const cardItems = cards.querySelectorAll('.testimonial-card');
      gsap.fromTo(
        cardItems[0],
        { x: '-8vw', opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cards,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        cardItems[1],
        { y: '6vh', opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cards,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        cardItems[2],
        { x: '8vw', opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cards,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Chips stagger
      const chipItems = chips.querySelectorAll('.use-case-chip');
      gsap.fromTo(
        chipItems,
        { scale: 0.96, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          stagger: 0.08,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: chips,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="relative bg-[#F6F7F9] py-24 md:py-32"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B0C10] mb-4">
            Trusted by teams that care about air quality
          </h2>
          <p className="subheadline text-secondary-light mx-auto">
            From studios to schools—Aerium helps people stay sharp, safe, and
            comfortable.
          </p>
        </div>

        {/* Publication Logos */}
        <div
          ref={logosRef}
          className="flex flex-wrap justify-center items-center gap-8 md:gap-16 mb-16 opacity-50"
        >
          {['TechCrunch', 'The Verge', 'Wired', 'Dezeen'].map((name) => (
            <div
              key={name}
              className="logo-item font-display text-lg md:text-xl font-semibold text-[#0B0C10]/40"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Testimonial Cards */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="testimonial-card card-white p-6 md:p-8 flex flex-col"
            >
              <Quote className="w-8 h-8 text-[#2F6BFF] mb-4 opacity-60" />
              <p className="text-[#0B0C10] text-lg leading-relaxed mb-6 flex-grow">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F6F7F9] flex items-center justify-center">
                  <testimonial.icon className="w-5 h-5 text-[#6B7280]" />
                </div>
                <div>
                  <div className="font-medium text-[#0B0C10] text-sm">
                    {testimonial.author}
                  </div>
                  <div className="text-secondary-light text-sm">
                    {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Use Case Chips */}
        <div ref={chipsRef} className="flex flex-wrap justify-center gap-3">
          {useCases.map((useCase) => (
            <div
              key={useCase.label}
              className="use-case-chip inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E5E7EB] text-sm text-[#0B0C10]"
            >
              <useCase.icon className="w-4 h-4 text-[#6B7280]" />
              {useCase.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

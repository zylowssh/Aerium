"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Package, Wifi, BarChart3 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: "01",
    icon: Package,
    title: "Unbox & Place",
    description:
      "Position the compact sensor anywhere in your room. No installation required—just plug it in.",
  },
  {
    number: "02",
    icon: Wifi,
    title: "Connect",
    description:
      "Pair with our app in seconds. The sensor automatically connects to your WiFi network.",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Monitor",
    description:
      "Start tracking air quality immediately. Get insights, alerts, and recommendations.",
  },
];

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const stepsContainer = stepsRef.current;

    if (!section || !header || !stepsContainer) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        header,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: header,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Steps stagger
      const stepItems = stepsContainer.querySelectorAll(".step-item");
      gsap.fromTo(
        stepItems,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: stepsContainer,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Connecting lines animation
      const lines = stepsContainer.querySelectorAll(".step-line");
      gsap.fromTo(
        lines,
        { scaleX: 0, transformOrigin: "left center" },
        {
          scaleX: 1,
          duration: 0.6,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: stepsContainer,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative bg-[#0B0C10] py-24 md:py-32"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-20">
          <span className="mono-label text-primary mb-4 block">
            HOW IT WORKS
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 text-balance">
            Set up in minutes, not hours
          </h2>
          <p className="subheadline text-secondary-dark mx-auto">
            No complex installation. No professional help needed. Just simple,
            effective air quality monitoring.
          </p>
        </div>

        {/* Steps */}
        <div
          ref={stepsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative"
        >
          {/* Connecting lines for desktop */}
          <div className="hidden md:block absolute top-[60px] left-[calc(16.67%+40px)] right-[calc(16.67%+40px)] h-px">
            <div className="step-line absolute left-0 w-[calc(50%-20px)] h-px bg-gradient-to-r from-primary/60 to-primary/20" />
            <div className="step-line absolute right-0 w-[calc(50%-20px)] h-px bg-gradient-to-l from-primary/60 to-primary/20" />
          </div>

          {steps.map((step, index) => (
            <div key={step.number} className="step-item text-center">
              {/* Number badge */}
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="w-[120px] h-[120px] rounded-full bg-[#1a1d24] border border-primary/20 flex items-center justify-center">
                  <step.icon className="w-10 h-10 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                  {step.number}
                </span>
              </div>

              <h3 className="font-display text-xl font-semibold text-white mb-3">
                {step.title}
              </h3>
              <p className="text-secondary-dark text-sm leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

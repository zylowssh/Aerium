"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Activity,
  Moon,
  Gauge,
  Bell,
  Smartphone,
  Zap,
} from "lucide-react";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Activity,
    title: "Real-time Monitoring",
    description:
      "Track CO2, temperature, and humidity levels as they happen with instant updates.",
  },
  {
    icon: Moon,
    title: "Dark Mode Dashboard",
    description:
      "A beautiful interface that's easy on the eyes, perfect for nighttime monitoring.",
  },
  {
    icon: Gauge,
    title: "Compact Sensor",
    description:
      "Sleek, minimal design that blends seamlessly into any room or workspace.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description:
      "Get notified before air quality dips so you can take action immediately.",
  },
  {
    icon: Smartphone,
    title: "Mobile App",
    description:
      "Monitor your spaces from anywhere with our intuitive mobile application.",
  },
  {
    icon: Zap,
    title: "Energy Insights",
    description:
      "Optimize ventilation schedules and reduce energy costs with data-driven insights.",
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const grid = gridRef.current;
    const showcase = showcaseRef.current;

    if (!section || !header || !grid || !showcase) return;

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

      // Feature cards stagger
      const cards = grid.querySelectorAll(".feature-card");
      gsap.fromTo(
        cards,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: grid,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Showcase animation
      gsap.fromTo(
        showcase,
        { y: 60, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: showcase,
            start: "top 80%",
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
      id="features"
      className="relative bg-[#F6F7F9] py-24 md:py-32"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16">
          <span className="mono-label text-primary mb-4 block">FEATURES</span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B0C10] mb-4 text-balance">
            Everything you need to monitor air quality
          </h2>
          <p className="subheadline text-secondary-light mx-auto">
            Professional-grade sensing with a consumer-friendly experience.
            Track what matters, when it matters.
          </p>
        </div>

        {/* Features Grid - Bento Style */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16"
        >
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`feature-card card-white p-6 md:p-8 ${
                index === 0 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-[#0B0C10] mb-2">
                {feature.title}
              </h3>
              <p className="text-secondary-light text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Dashboard Showcase */}
        <div
          ref={showcaseRef}
          className="relative rounded-2xl overflow-hidden card-white"
        >
          <div className="aspect-video relative">
            <Image
              src="/dashboard_ui_light.jpg"
              alt="Aerium Dashboard Interface"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <span className="mono-label text-white/70 mb-2 block">
              LIVE DASHBOARD
            </span>
            <h3 className="font-display text-xl md:text-2xl font-bold text-white mb-2">
              See your data at a glance
            </h3>
            <p className="text-white/80 text-sm max-w-md">
              Intuitive charts and real-time updates help you understand air
              quality patterns and make informed decisions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

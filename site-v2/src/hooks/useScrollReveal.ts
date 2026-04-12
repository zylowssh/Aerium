import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealOptions {
  duration?: number;
  delay?: number;
  stagger?: number | { amount: number; from: string };
  ease?: string;
  markers?: boolean;
  start?: string;
  end?: string;
  scrub?: number | boolean;
}

/**
 * Hook for scroll-triggered reveal animations
 * Animates elements from hidden to visible state when they enter the viewport
 */
export const useScrollReveal = (options: ScrollRevealOptions = {}) => {
  const {
    duration = 0.8,
    delay = 0,
    stagger = 0.1,
    ease = 'power2.out',
    markers = false,
    start = 'top 80%',
    end = 'top 30%',
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const children = containerRef.current.querySelectorAll('[data-scroll-item]');

    // Initial state
    gsap.set(children, {
      opacity: 0,
      y: 60,
    });

    // Stagger animation on scroll
    children.forEach((child, index) => {
      gsap.to(child, {
        opacity: 1,
        y: 0,
        duration,
        delay: delay + index * (typeof stagger === 'number' ? stagger : 0),
        ease,
        scrollTrigger: {
          trigger: child,
          start,
          end,
          markers,
          onEnter: () => {},
        },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [duration, delay, stagger, ease, markers, start, end]);

  return containerRef;
};

/**
 * Hook for scroll-triggered parallax effects
 * Creates depth effect by moving elements at different speeds
 */
export const useParallax = (speed: number = -50) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      onUpdate: (self) => {
        gsap.to(ref.current, {
          y: self.getVelocity() * speed * 0.001,
          overwrite: 'auto',
          duration: 0.5,
        });
      },
    });

    return () => {
      trigger.kill();
    };
  }, [speed]);

  return ref;
};

/**
 * Hook for scroll progress animations
 * Animates based on scroll progress within a trigger element
 */
export const useScrollProgress = (options: ScrollRevealOptions = {}) => {
  const {
    start = 'top center',
    end = 'bottom center',
    scrub = 1,
    markers = false,
  } = options;

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const proxy = { skew: 0, skewSetter: (x: number) => { ref.current && (ref.current.style.transform = `skewY(${x}deg)`); }, onUpdate: () => {} },
      clamp = gsap.utils.clamp(-20, 20),
      onUpdate = () => {
        let skew = clamp(gsap.getProperty('body', 'scrollVelocity') as number);
        if (Math.abs(skew) > Math.abs(proxy.skew)) {
          proxy.skew = skew;
          gsap.to(proxy, {
            skew: 0,
            duration: 0.8,
            ease: 'power3',
            overwrite: true,
            onUpdate: () => proxy.skewSetter(proxy.skew),
          });
        }
      };

    ScrollTrigger.create({ onUpdate });

    gsap.set(ref.current, { transformOrigin: 'center center', force3D: true });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return ref;
};

/**
 * Hook for pin and parallax combined
 * Pins an element while scrolling through it with parallax effect
 */
export const usePinnedParallax = (speed: number = 100) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.to(ref.current, {
      scrollTrigger: {
        trigger: ref.current,
        start: 'top center',
        end: 'bottom center',
        scrub: 1,
        markers: false,
      },
      y: -speed,
      ease: 'none',
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [speed]);

  return ref;
};

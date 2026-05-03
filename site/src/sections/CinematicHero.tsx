import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const STYLES = `
  .ph1-text-3d-matte {
    color: #ffffff;
    text-shadow:
      0 10px 30px rgba(255,255,255,0.15),
      0 2px 4px rgba(255,255,255,0.08);
  }
  .ph1-text-silver-matte {
    background: linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.35) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transform: translateZ(0);
    filter:
      drop-shadow(0px 10px 20px rgba(255,255,255,0.12))
      drop-shadow(0px 2px 4px rgba(255,255,255,0.08));
  }
`;

interface CinematicHeroProps {
  onComplete: () => void;
  tagline1?: string;
  tagline2?: string;
}

export default function CinematicHero({
  onComplete,
  tagline1 = "L'invisible",
  tagline2 = 'rendu visible.',
}: CinematicHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete();
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set('.ph1-text-track', {
        autoAlpha: 0, y: 60, scale: 0.85, filter: 'blur(20px)', rotationX: -20,
      });
      gsap.set('.ph1-text-days', { autoAlpha: 1, clipPath: 'inset(0 100% 0 0)' });

      gsap.timeline({ delay: 0.25,
        onComplete: () =>
          gsap.to(containerRef.current, {
            opacity: 0, duration: 0.8, ease: 'power2.inOut', onComplete: onComplete,
          }),
      })
        .to('.ph1-text-track', {
          duration: 1.8, autoAlpha: 1, y: 0, scale: 1,
          filter: 'blur(0px)', rotationX: 0, ease: 'expo.out',
        })
        .to('.ph1-text-days', {
          duration: 1.4, clipPath: 'inset(0 0% 0 0)', ease: 'power4.inOut',
        }, '-=1.0')
        .to({}, { duration: 0.5 })
        .to(['.ph1-text-track', '.ph1-text-days'], {
          y: -32, opacity: 0, filter: 'blur(14px)', scale: 1.04,
          duration: 0.8, ease: 'power3.in', stagger: 0.06,
        });
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none"
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div
        className="flex flex-col items-center justify-center text-center w-screen px-4"
        style={{ perspective: '1000px' }}
      >
        <h1 className="ph1-text-track ph1-text-3d-matte text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tight mb-2">
          {tagline1}
        </h1>
        <h1 className="ph1-text-days ph1-text-silver-matte text-5xl md:text-7xl lg:text-[6rem] font-extrabold tracking-tighter">
          {tagline2}
        </h1>
      </div>
    </div>
  );
}

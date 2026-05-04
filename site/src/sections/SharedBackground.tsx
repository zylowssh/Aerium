import { useEffect, useRef, useState } from 'react';

import heroDarkVideoLoop from '@/assets/landing/hero-dark-nature-loop.mp4';
import heroDarkImage from '@/assets/landing/hero-dark-nature.jpg';

export default function SharedBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [seamOpacity, setSeamOpacity] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let rafId = 0;
    const fadeWindowSeconds = 0.28;
    const maxSeamOpacity = 0.16;

    const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
    const easeInCubic = (value: number) => value * value * value;
    const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

    const sampleSeam = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const currentTime = video.currentTime || 0;

      if (duration > fadeWindowSeconds * 2) {
        const endDistance = duration - currentTime;
        const startDistance = currentTime;

        const endFade = easeOutCubic(clamp01(1 - endDistance / fadeWindowSeconds));
        const startFade = easeInCubic(clamp01(1 - startDistance / fadeWindowSeconds));
        const nextOpacity = Math.max(endFade, startFade) * maxSeamOpacity;

        setSeamOpacity((previous) => (Math.abs(previous - nextOpacity) > 0.01 ? nextOpacity : previous));
      } else {
        setSeamOpacity(0);
      }

      rafId = window.requestAnimationFrame(sampleSeam);
    };

    sampleSeam();

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover object-[center_24%] motion-reduce:hidden"
        poster={heroDarkImage}
        aria-hidden="true"
      >
        <source src={heroDarkVideoLoop} type="video/mp4" />
      </video>

      <div
        className="absolute inset-0 bg-slate-950/35 motion-reduce:hidden"
        style={{ opacity: seamOpacity, transition: 'opacity 90ms linear' }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-slate-950/96" />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 16% 22%, rgba(16,185,129,0.18) 0%, transparent 46%),' +
            'radial-gradient(circle at 86% 74%, rgba(56,189,248,0.12) 0%, transparent 38%)',
        }}
      />
    </div>
  );
}

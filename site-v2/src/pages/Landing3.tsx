import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import UseCasesSection from '@/components/landing/UseCasesSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

const VideoSection = lazy(() => import('@/components/landing/VideoSection'));

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const Landing3 = () => {
  const sectionsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const [shouldRenderVideo, setShouldRenderVideo] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Warm the heavy video section shortly after mount so the first snap feels instant.
    const preloadTimeout = window.setTimeout(() => {
      import('@/components/landing/VideoSection').finally(() => {
        if (!cancelled) {
          setShouldRenderVideo(true);
        }
      });
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(preloadTimeout);
    };
  }, []);

  useEffect(() => {
    if (!footerRef.current) {
      return;
    }

    const updateFooterHeight = () => {
      if (footerRef.current) {
        setFooterHeight(footerRef.current.offsetHeight);
      }
    };

    updateFooterHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateFooterHeight();
    });

    resizeObserver.observe(footerRef.current);
    window.addEventListener('resize', updateFooterHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateFooterHeight);
    };
  }, []);

  useEffect(() => {
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';

    return () => {
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    };
  }, []);

  useLayoutEffect(() => {
    const container = sectionsRef.current;
    if (!container) {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>('[data-scroll-section]');
      if (panels.length === 0) {
        return;
      }

      panels.forEach((panel, index) => {
        gsap.set(panel, {
          zIndex: panels.length - index,
          willChange: 'transform, opacity',
          transformOrigin: '50% 50%',
        });
      });

      let panelStarts: number[] = [];
      let maxScroll = 0;

      const updatePanelStarts = () => {
        panelStarts = panels.map((panel) => panel.getBoundingClientRect().top + window.scrollY);
        maxScroll = ScrollTrigger.maxScroll(window);
      };

      updatePanelStarts();
      ScrollTrigger.addEventListener('refreshInit', updatePanelStarts);

      panels.forEach((panel) => {
        ScrollTrigger.create({
          trigger: panel,
          start: 'top top',
          end: () => `+=${Math.max(1, panel.scrollHeight - window.innerHeight)}`,
          pin: true,
          pinSpacing: false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
        });
      });

      panels.forEach((panel, index) => {
        const nextPanel = panels[index + 1];
        if (!nextPanel) {
          return;
        }

        gsap.fromTo(
          panel,
          { scale: 1, yPercent: 0, autoAlpha: 1 },
          {
            scale: 0.97,
            yPercent: -7,
            autoAlpha: 0.6,
            ease: 'none',
            scrollTrigger: {
              trigger: nextPanel,
              start: 'top bottom',
              end: 'top top',
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        );

        gsap.fromTo(
          nextPanel,
          { yPercent: 14, autoAlpha: 0.6, scale: 1.03 },
          {
            yPercent: 0,
            autoAlpha: 1,
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: nextPanel,
              start: 'top bottom',
              end: 'top top',
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        );
      });

      ScrollTrigger.create({
        trigger: container,
        start: 0,
        end: 'max',
        invalidateOnRefresh: true,
        snap: {
          snapTo: (progress) => {
            if (!panelStarts.length || maxScroll <= 0) {
              return progress;
            }

            const currentScroll = progress * maxScroll;
            let closest = panelStarts[0];
            let closestDistance = Math.abs(currentScroll - closest);

            for (let i = 1; i < panelStarts.length; i += 1) {
              const distance = Math.abs(currentScroll - panelStarts[i]);
              if (distance < closestDistance) {
                closest = panelStarts[i];
                closestDistance = distance;
              }
            }

            return gsap.utils.clamp(0, 1, closest / maxScroll);
          },
          duration: { min: 0.22, max: 0.62 },
          delay: 0.04,
          ease: 'power2.inOut',
          directional: false,
          inertia: false,
        },
      });

      ScrollTrigger.refresh();

      return () => {
        ScrollTrigger.removeEventListener('refreshInit', updatePanelStarts);
      };
    }, container);

    return () => ctx.revert();
  }, [footerHeight]);

  const scrollToVideo = () => {
    if (videoRef.current) {
      const targetY = videoRef.current.getBoundingClientRect().top + window.scrollY;
      gsap.to(window, {
        duration: 0.9,
        scrollTo: { y: targetY, autoKill: true },
        ease: 'power2.out',
      });
    }
  };

  return (
    <div className="landing-theme theme-smooth min-h-screen bg-background overflow-x-clip relative">
      <div ref={sectionsRef} className="relative z-10 bg-background" style={{ overscrollBehaviorY: 'contain' }}>
        <Navbar onScrollToSection={scrollToVideo} />

        <div data-scroll-section className="landing3-panel min-h-screen">
          <HeroSection onScrollToSection={scrollToVideo} />
        </div>

        <div ref={videoRef} data-scroll-section className="landing3-panel min-h-screen">
          {shouldRenderVideo ? (
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement video...</div>}>
              <VideoSection />
            </Suspense>
          ) : (
            <div className="min-h-screen flex items-center justify-center text-muted-foreground">Preparation video...</div>
          )}
        </div>

        <div data-scroll-section className="landing3-panel min-h-screen">
          <FeaturesSection />
        </div>

        <div data-scroll-section className="landing3-panel min-h-screen">
          <HowItWorksSection />
        </div>

        <div data-scroll-section className="landing3-panel min-h-screen">
          <UseCasesSection />
        </div>

        <div data-scroll-section className="landing3-panel min-h-screen">
          <CTASection />
        </div>
      </div>

      <div className="relative z-0" style={{ height: footerHeight > 0 ? `${footerHeight}px` : '100vh' }} />

      <Footer ref={footerRef} className="fixed inset-x-0 bottom-0 z-0" />
    </div>
  );
};

export default Landing3;

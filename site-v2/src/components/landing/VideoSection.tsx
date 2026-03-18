import { Player } from "@remotion/player";
import { AeriumVideo, AERIUM_VIDEO_DURATION } from "@/remotion/AeriumVideo";
import { IntroductionScene } from "@/remotion/compositions/IntroductionScene";
import { ProblemScene } from "@/remotion/compositions/ProblemScene";
import { SolutionScene } from "@/remotion/compositions/SolutionScene";
import { ObjectiveScene } from "@/remotion/compositions/ObjectiveScene";
import { HowItWorksScene } from "@/remotion/compositions/HowItWorksScene";
import { FeaturesScene } from "@/remotion/compositions/FeaturesScene";
import { TechStackScene } from "@/remotion/compositions/TechStackScene";
import { UseCasesScene } from "@/remotion/compositions/UseCasesScene";
import { ConclusionScene } from "@/remotion/compositions/ConclusionScene";
import { DatabaseSchemaScene } from "@/remotion/compositions/DatabaseSchemaScene";
import { BackendArchitectureScene } from "@/remotion/compositions/BackendArchitectureScene";
import { useState, forwardRef, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Sparkles } from "lucide-react";

const compositions = [
  { id: "full", label: "Vidéo Complète", frames: AERIUM_VIDEO_DURATION, component: AeriumVideo },
  { id: "introduction", label: "Introduction", frames: 180, component: IntroductionScene },
  { id: "problem", label: "Le Problème", frames: 150, component: ProblemScene },
  { id: "solution", label: "La Solution", frames: 180, component: SolutionScene },
  { id: "objective", label: "Objectif", frames: 150, component: ObjectiveScene },
  { id: "how-it-works", label: "Fonctionnement", frames: 180, component: HowItWorksScene },
  { id: "features", label: "Fonctionnalités", frames: 150, component: FeaturesScene },
  { id: "database", label: "Base de Données", frames: 180, component: DatabaseSchemaScene },
  { id: "backend", label: "Backend", frames: 180, component: BackendArchitectureScene },
  { id: "tech-stack", label: "Technique", frames: 180, component: TechStackScene },
  { id: "use-cases", label: "Cas d'Usage", frames: 150, component: UseCasesScene },
  { id: "conclusion", label: "Conclusion", frames: 180, component: ConclusionScene },
];

const VideoSection = forwardRef<HTMLDivElement>((_props, ref) => {
  const [activeScene, setActiveScene] = useState("full");
  const [isInView, setIsInView] = useState(false);
  const scrollTargetRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const isLowEndDevice = (() => {
    if (typeof navigator === "undefined") {
      return false;
    }

    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };

    const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
    const lowCpu = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;
    const prefersDataSaver = Boolean(nav.connection?.saveData);

    return lowMemory || lowCpu || prefersDataSaver;
  })();

  const currentComposition = compositions.find((c) => c.id === activeScene) || compositions[0];

  // Intersection Observer to detect when section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: [0, 0.5, 1] }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Expose scroll target through ref
  useEffect(() => {
    if (ref && typeof ref === 'object' && 'current' in ref) {
      ref.current = scrollTargetRef.current;
    }
  }, [ref]);

  return (
    <section ref={sectionRef} className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-[#eff1f2] via-[#eff1f2] to-[#eff1f2] dark:from-[#0f141c] dark:via-[#0f141c] dark:to-[#0f141c]">
      <div ref={scrollTargetRef} className="w-full max-w-7xl">
        {/* Header Section */}
        <motion.div 
          className="text-center mb-16 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6 border border-emerald-500/25 font-manrope"
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="w-4 h-4" />
            Demo Interactive
          </motion.span>
          <motion.h2 
            className="text-4xl sm:text-5xl lg:text-6xl text-foreground mb-4 leading-tight"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="block font-manrope font-semibold">Decouvrez Aerium</span>
            <span className="block font-editorial italic text-cyan-700/90 dark:text-cyan-300/90">en action continue.</span>
          </motion.h2>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Visualisez comment notre technologie surveille et analyse la qualité de l'air en temps réel.
          </motion.p>
        </motion.div>

        {/* Controls - Commented out for now */}

        {/* Scene selector - Deleted */}

        {/* Video player with layered card treatment matching the landing style */}
        <div className="relative mb-20 z-10">
          <motion.div
            className="absolute -inset-8 rounded-[2.5rem] bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.24),transparent_42%),radial-gradient(circle_at_85%_82%,rgba(34,211,238,0.2),transparent_44%)] dark:bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.3),transparent_42%),radial-gradient(circle_at_85%_82%,rgba(34,211,238,0.24),transparent_44%)] blur-2xl -z-30"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={isInView ? { opacity: [0.28, 0.46, 0.28], scale: [1.02, 1.06, 1.02] } : { opacity: 0.2, scale: 1.01 }}
            transition={isInView ? { duration: 6.5, ease: "easeInOut", repeat: Infinity } : { duration: 0.4, ease: "easeOut" }}
            style={{ pointerEvents: "none" }}
          />

          <motion.div
            className="absolute -inset-px rounded-[2rem] bg-gradient-to-br from-white/80 via-white/40 to-transparent dark:from-white/20 dark:via-white/10 dark:to-transparent -z-10"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: isInView ? 0.72 : 0.5 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ pointerEvents: "none" }}
          />

          {/* Main video player container */}
          <motion.div 
            className="relative rounded-[2rem] overflow-hidden border border-white/55 dark:border-white/15 shadow-[0_24px_70px_-26px_rgba(15,23,42,0.55)] dark:shadow-[0_24px_70px_-26px_rgba(0,0,0,0.85)] bg-white/45 dark:bg-slate-950/65 backdrop-blur-2xl z-10"
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            whileHover={{ y: -4 }}
          >
            <div className="pointer-events-none absolute inset-0 z-20">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.07)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:58px_58px] opacity-[0.22]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/22 via-transparent to-transparent" />
            </div>

            <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/45 dark:border-white/20 bg-white/70 dark:bg-black/35 px-3 py-1.5 backdrop-blur-md">
                <span className="relative inline-flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[0.68rem] tracking-[0.16em] uppercase text-foreground/80 font-manrope">Visualisation en direct</span>
              </div>

              <div className="rounded-full border border-white/45 dark:border-white/20 bg-white/70 dark:bg-black/35 px-3 py-1.5 text-[0.68rem] tracking-[0.16em] uppercase text-foreground/75 font-manrope backdrop-blur-md">
                {currentComposition.frames} frames
              </div>
            </div>

            <div className="aspect-video relative bg-gradient-to-br from-white/35 to-white/70 dark:from-slate-950/65 dark:to-slate-900/80">
              <AnimatePresence mode="wait">
                {isInView && (
                  <motion.div
                    key={activeScene}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full"
                  >
                    <Player
                      component={currentComposition.component}
                      durationInFrames={currentComposition.frames}
                      fps={isLowEndDevice ? 24 : 30}
                      compositionWidth={1920}
                      compositionHeight={1080}
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                      controls
                      loop={!isLowEndDevice}
                      autoPlay={!isLowEndDevice}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              {!isInView && (
                <motion.div 
                  className="w-full h-full bg-gradient-to-br from-card/50 to-card/30 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div 
                    className="text-center space-y-3"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <motion.div 
                      className="inline-block"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Play className="w-8 h-8 text-primary/60 mx-auto" />
                    </motion.div>
                    <p className="text-muted-foreground text-sm">Video en attente...</p>
                  </motion.div>
                </motion.div>
              )}
            </div>

            <div className="absolute bottom-4 left-4 z-30 rounded-full border border-white/45 dark:border-white/20 bg-white/70 dark:bg-black/35 px-3 py-1.5 text-[0.68rem] tracking-[0.14em] uppercase text-foreground/75 font-manrope backdrop-blur-md">
              Aerium Experience
            </div>
          </motion.div>
        </div>

        {/* Info 
        <motion.div 
          className="text-center space-y-3 mt-12 px-6 py-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 mx-auto max-w-md"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm font-medium text-foreground">
              {currentComposition.label}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {currentComposition.frames} frames @ 30fps = {(currentComposition.frames / 30).toFixed(1)}s
            </p>
          </motion.div>
          <motion.div
            className="pt-2 border-t border-border/30"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-xs text-muted-foreground/70">
              Projet Aerium - Qualité de l'air IoT
            </p>
          </motion.div>
        </motion.div>
        */}
      </div>
    </section>
  );
});

VideoSection.displayName = 'VideoSection';

export default VideoSection;

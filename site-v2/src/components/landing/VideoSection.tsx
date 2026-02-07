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
import { Download, Copy, Check, Play } from "lucide-react";

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

const VideoSection = forwardRef<HTMLDivElement>((props, ref) => {
  const [activeScene, setActiveScene] = useState("full");
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTargetRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

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

  // Debounce scroll to reduce animation triggers
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const copyExportCommand = async (command: string) => {
    await navigator.clipboard.writeText(command);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const exportCommands = {
    full: "npx remotion render src/remotion/index.ts AeriumVideo out/aerium-video.mp4",
    scene: `npx remotion render src/remotion/index.ts ${activeScene} out/${activeScene}.mp4`,
  };

  // Expose scroll target through ref
  useEffect(() => {
    if (ref && typeof ref === 'object' && 'current' in ref) {
      ref.current = scrollTargetRef.current;
    }
  }, [ref]);

  return (
    <section ref={sectionRef} className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/20 to-muted/10">
      <div ref={scrollTargetRef} className="w-full max-w-7xl">
        {/* Header Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2 
            className="text-3xl sm:text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Découvrez Aerium en Action
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

        {/* Scene selector */}
        <motion.div 
          className="flex flex-wrap gap-2 justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-wrap gap-2 justify-center p-4 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg">
            <AnimatePresence>
              {compositions.map((comp, index) => (
                <motion.button
                  key={comp.id}
                  onClick={() => setActiveScene(comp.id)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all relative overflow-hidden group ${
                    activeScene === comp.id
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/50"
                      : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-primary/50"
                  }`}
                >
                  {/* Shine effect on hover */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  
                  <span className="relative flex items-center gap-2">
                    {activeScene === comp.id && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Play className="w-3 h-3" />
                      </motion.span>
                    )}
                    {comp.label}
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Video player with pronounced depth effect */}
        <div ref={videoContainerRef} className="relative mb-8">
          {/* Far background depth layer - cyan/blue glow */}
          {!isScrolling && (
            <motion.div 
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 blur-3xl -z-30 scale-125"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.9, scale: 1.25 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ pointerEvents: "none" }}
            />
          )}
          {isScrolling && (
            <div 
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 blur-3xl -z-30 scale-125 opacity-40"
              style={{ pointerEvents: "none" }}
            />
          )}
          
          {/* Mid background depth layer - accent/purple glow */}
          {!isScrolling && (
            <motion.div 
              className="absolute inset-0 rounded-3xl bg-gradient-to-tl from-accent/20 via-primary/15 to-accent/20 blur-2xl -z-20 scale-110"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.7, scale: 1.15 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ pointerEvents: "none" }}
            />
          )}
          {isScrolling && (
            <div 
              className="absolute inset-0 rounded-3xl bg-gradient-to-tl from-accent/20 via-primary/15 to-accent/20 blur-2xl -z-20 scale-110 opacity-30"
              style={{ pointerEvents: "none" }}
            />
          )}
          
          {/* Foreground depth layer - primary/accent */}
          {!isScrolling && (
            <motion.div 
              className="absolute inset-0 rounded-3xl bg-gradient-to-t from-primary/15 via-accent/10 to-transparent blur-xl -z-10 scale-105"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 0.6, scale: 1.08 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ pointerEvents: "none" }}
            />
          )}
          {isScrolling && (
            <div 
              className="absolute inset-0 rounded-3xl bg-gradient-to-t from-primary/15 via-accent/10 to-transparent blur-xl -z-10 scale-105 opacity-20"
              style={{ pointerEvents: "none" }}
            />
          )}

          {/* Main video player container */}
          <motion.div 
            className="rounded-3xl overflow-hidden border-2 border-primary/30 shadow-2xl shadow-primary/20 bg-card/80 backdrop-blur-sm relative z-10 hover:border-primary/50 transition-colors"
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={!isScrolling ? { boxShadow: "0 20px 50px rgba(var(--primary), 0.3)" } : undefined}
          >
            <div className="aspect-video relative bg-gradient-to-br from-card/50 to-card/80">
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
                      fps={30}
                      compositionWidth={1920}
                      compositionHeight={1080}
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                      controls
                      loop
                      autoPlay
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
                    <p className="text-muted-foreground text-sm">Vidéo en attente...</p>
                  </motion.div>
                </motion.div>
              )}
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

import { Player, type PlayerRef } from "@remotion/player";
import { AeriumVideo, AERIUM_VIDEO_DURATION } from "@/remotion/AeriumVideo";
import { useState, forwardRef, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Sparkles, Volume2, VolumeX, Maximize2, Minimize2 } from "lucide-react";

const CONTROL_HIDE_DELAY_MS = 1800;

const VideoSection = forwardRef<HTMLDivElement>((_props, ref) => {
  const [isInView, setIsInView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const scrollTargetRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoShellRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerRef | null>(null);
  const hasAutoStartedRef = useRef(false);
  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canAutoHideControlsRef = useRef(false);

  const isLowEndDevice = (() => {
    if (typeof navigator === "undefined") return false;
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
    const lowCpu = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;
    const prefersDataSaver = Boolean(nav.connection?.saveData);
    return lowMemory || lowCpu || prefersDataSaver;
  })();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting && !hasAutoStartedRef.current) {
          hasAutoStartedRef.current = true;
          setIsPlaying(true);
        }
      },
      { threshold: 0.3 }
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

  useEffect(() => {
    if (ref && typeof ref === 'object' && 'current' in ref) {
      ref.current = scrollTargetRef.current;
    }
  }, [ref]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    canAutoHideControlsRef.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  const clearHideControlsTimeout = () => {
    if (!hideControlsTimeoutRef.current) {
      return;
    }

    clearTimeout(hideControlsTimeoutRef.current);
    hideControlsTimeoutRef.current = null;
  };

  const scheduleControlHide = () => {
    clearHideControlsTimeout();

    if (!canAutoHideControlsRef.current || !isPlaying || !isInView) {
      return;
    }

    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, CONTROL_HIDE_DELAY_MS);
  };

  const handleControlsActivity = () => {
    setShowControls(true);
    scheduleControlHide();
  };

  const handleControlsMouseLeave = () => {
    if (!canAutoHideControlsRef.current || !isPlaying) {
      return;
    }

    clearHideControlsTimeout();
    setShowControls(false);
  };

  useEffect(() => {
    if (!isPlaying || !isInView) {
      clearHideControlsTimeout();
      setShowControls(true);
      return;
    }

    scheduleControlHide();

    return () => {
      clearHideControlsTimeout();
    };
  }, [isPlaying, isInView]);

  useEffect(() => {
    return () => {
      clearHideControlsTimeout();
    };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      const fullscreenElement = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
      setIsFullscreen(fullscreenElement === videoShellRef.current);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!isInView || !playerRef.current) {
      return;
    }

    if (isPlaying) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  }, [isPlaying, isInView]);

  useEffect(() => {
    if (!isInView || !playerRef.current) {
      return;
    }

    if (isMuted) {
      playerRef.current.mute();
    } else {
      playerRef.current.unmute();
    }
  }, [isMuted, isInView]);

  const togglePlayPause = () => {
    setIsPlaying((currentlyPlaying) => {
      const nextPlaying = !currentlyPlaying;

      if (playerRef.current) {
        if (nextPlaying) {
          playerRef.current.play();
        } else {
          playerRef.current.pause();
        }
      }

      return nextPlaying;
    });
  };

  const toggleMute = () => {
    setIsMuted((currentlyMuted) => {
      const nextMuted = !currentlyMuted;

      if (playerRef.current) {
        if (nextMuted) {
          playerRef.current.mute();
        } else {
          playerRef.current.unmute();
        }
      }

      return nextMuted;
    });
  };

  const toggleFullscreen = () => {
    const target = videoShellRef.current;
    if (!target) {
      return;
    }

    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
      webkitFullscreenElement?: Element | null;
    };
    const fullscreenElement = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;

    if (fullscreenElement === target) {
      if (doc.exitFullscreen) {
        void doc.exitFullscreen();
        return;
      }

      if (doc.webkitExitFullscreen) {
        void doc.webkitExitFullscreen();
      }

      return;
    }

    const fullscreenTarget = target as HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      webkitRequestFullScreen?: () => void;
    };

    if (fullscreenTarget.requestFullscreen) {
      void fullscreenTarget.requestFullscreen();
      return;
    }

    if (fullscreenTarget.webkitRequestFullscreen) {
      void fullscreenTarget.webkitRequestFullscreen();
      return;
    }

    if (fullscreenTarget.webkitRequestFullScreen) {
      fullscreenTarget.webkitRequestFullScreen();
    }
  };

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32 relative overflow-hidden bg-gradient-to-b from-[#eff1f2] via-[#eff1f2] to-[#eff1f2] dark:from-[#0f141c] dark:via-[#0f141c] dark:to-[#0f141c]"
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 dark:opacity-15 blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4), transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-20 dark:opacity-15 blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(34, 211, 238, 0.4), transparent 70%)' }}
        />
      </div>

      <div ref={scrollTargetRef} className="w-full max-w-5xl relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-8 sm:mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-medium mb-4 sm:mb-6 border border-emerald-500/25 font-manrope"
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Demo Interactive
          </motion.span>

          <motion.h2
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-foreground mb-3 sm:mb-4 leading-tight"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="block font-manrope font-semibold">Découvrez Aerium</span>
            <span className="block font-editorial italic text-cyan-700/90 dark:text-cyan-300/90">en vidéo.</span>
          </motion.h2>

          <motion.p
            className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl mx-auto px-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Visualisez comment notre technologie surveille et analyse la qualité de l'air en temps réel.
          </motion.p>
        </motion.div>

        {/* Video Player Container */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Glow effect behind the player */}
          <div className="absolute -inset-4 sm:-inset-6 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-emerald-400/20 via-transparent to-cyan-400/20 dark:from-emerald-400/10 dark:to-cyan-400/10 blur-2xl opacity-60 pointer-events-none" />

          {/* Main video container */}
          <div
            ref={videoShellRef}
            className="relative rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden border border-white/50 dark:border-white/10 shadow-2xl shadow-black/20 dark:shadow-black/40 bg-white/30 dark:bg-slate-950/50 backdrop-blur-xl"
            onMouseMove={handleControlsActivity}
            onMouseEnter={handleControlsActivity}
            onMouseLeave={handleControlsMouseLeave}
          >
            {/* Top bar with status indicators */}
            <div className={`absolute top-0 left-0 right-0 z-20 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-black/30 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="flex items-center gap-2 sm:gap-3 text-white/80">
                <span className="text-[10px] sm:text-xs font-medium font-manrope hidden sm:inline">
                  {Math.round(AERIUM_VIDEO_DURATION / 30)}s
                </span>
              </div>
            </div>

            {/* Video player */}
            <div className="aspect-video relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950">
              {isInView ? (
                <Player
                  ref={playerRef}
                  component={AeriumVideo}
                  durationInFrames={AERIUM_VIDEO_DURATION}
                  fps={isLowEndDevice ? 24 : 30}
                  compositionWidth={1920}
                  compositionHeight={1080}
                  style={{ width: "100%", height: "100%" }}
                  controls={false}
                  loop
                  autoPlay={isPlaying}
                  initiallyMuted={isMuted}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <motion.div
                    className="flex flex-col items-center gap-3"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Play className="w-10 h-10 sm:w-12 sm:h-12 text-foreground/40" />
                    <p className="text-xs sm:text-sm text-muted-foreground font-manrope">
                      Défilez pour voir la démo
                    </p>
                  </motion.div>
                </div>
              )}

              {/* Play/Pause overlay button */}
              <button
                onClick={togglePlayPause}
                className="absolute inset-0 flex items-center justify-center group cursor-pointer"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                <motion.div
                  className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 dark:border-white/10 flex items-center justify-center transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                  ) : (
                    <Play className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white ml-1" />
                  )}
                </motion.div>
              </button>
            </div>

            {/* Bottom control bar */}
            <div className={`absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-t from-black/40 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={togglePlayPause}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-colors"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  ) : (
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={toggleMute}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-colors"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={toggleFullscreen}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm items-center justify-center transition-colors ${isFullscreen ? 'flex' : 'hidden sm:flex'}`}
                  aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Optional subtitle/caption below video */}
        <motion.p
          className="text-center text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6 font-manrope"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          Projet Aerium - Surveillance de la qualité de l'air
        </motion.p>
      </div>
    </section>
  );
});

VideoSection.displayName = 'VideoSection';

export default VideoSection;

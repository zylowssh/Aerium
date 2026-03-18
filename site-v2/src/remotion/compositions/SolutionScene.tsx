import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig, Img, staticFile } from "remotion";
import { AnimatedBackground, SceneTransition } from "../components";
import { Sparkles } from "lucide-react";

export const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Intro text
  const introOpacity = interpolate(frame, [10, 35], [0, 1], { extrapolateRight: "clamp" });
  const introY = interpolate(frame, [10, 35], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Logo animation with bounce
  const logoScale = spring({
    frame: frame - 45,
    fps,
    config: { damping: 10, stiffness: 100, mass: 0.8 },
  });
  const logoRotation = interpolate(frame, [45, 65], [-5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title animation
  const titleOpacity = interpolate(frame, [55, 75], [0, 1], { extrapolateRight: "clamp" });
  const titleX = interpolate(frame, [55, 75], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Action pills animation
  const descOpacity = interpolate(frame, [90, 115], [0, 1], { extrapolateRight: "clamp" });
  const descY = interpolate(frame, [90, 115], [25, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Sparkle effects
  const sparkle1Opacity = interpolate((frame + 10) % 40, [0, 20, 40], [0, 1, 0]);
  const sparkle2Opacity = interpolate((frame + 25) % 40, [0, 20, 40], [0, 1, 0]);
  const sparkle3Opacity = interpolate((frame + 35) % 40, [0, 20, 40], [0, 1, 0]);

  // Glow pulse
  const glowIntensity = interpolate(frame % 60, [0, 30, 60], [0.4, 0.8, 0.4]);

  const actionPills = ["Collecter", "Analyser", "Agir"];

  return (
    <AbsoluteFill style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <AnimatedBackground variant="solution" particleCount={30} />

      {/* Large central glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsla(165, 70%, 55%, 0.2) 0%, transparent 60%)",
          opacity: glowIntensity,
          filter: "blur(80px)",
        }}
      />

      {/* Sparkle decorations */}
      {[
        { x: -280, y: -100, opacity: sparkle1Opacity, scale: 0.8 },
        { x: 300, y: -80, opacity: sparkle2Opacity, scale: 1 },
        { x: 250, y: 120, opacity: sparkle3Opacity, scale: 0.6 },
      ].map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px)) scale(${s.scale})`,
            opacity: s.opacity * 0.7,
          }}
        >
          <Sparkles size={24} color="hsl(165, 70%, 55%)" />
        </div>
      ))}

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          padding: 60,
        }}
      >
        {/* Intro text */}
        <p
          style={{
            fontSize: 24,
            color: "hsl(195, 34%, 74%)",
            margin: 0,
            opacity: introOpacity,
            transform: `translateY(${introY}px)`,
            textAlign: "center",
          }}
        >
          Une plateforme visuelle pour la qualite de l'air
        </p>

        {/* Logo + Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            transform: `scale(${logoScale}) rotate(${logoRotation}deg)`,
          }}
        >
          <div
            style={{
              position: "relative",
            }}
          >
            <Img
              src={staticFile("favicon.png")}
              style={{
                width: 110,
                height: 110,
                filter: `drop-shadow(0 0 ${30 * glowIntensity}px hsla(165, 70%, 55%, 0.5))`,
              }}
            />
          </div>
          <h1
            style={{
              fontSize: 90,
              fontWeight: 700,
              margin: 0,
              opacity: titleOpacity,
              transform: `translateX(${titleX}px)`,
            }}
          >
            <span style={{ color: "hsl(210, 40%, 98%)" }}>Aer</span>
            <span
              style={{
                background: "linear-gradient(135deg, hsl(165, 70%, 55%) 0%, hsl(190, 80%, 50%) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ium
            </span>
          </h1>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 30,
            color: "hsl(205, 42%, 90%)",
            margin: 0,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.35,
            opacity: descOpacity,
            transform: `translateY(${descY}px)`,
            fontWeight: 600,
          }}
        >
          Mesurer. Comprendre. Decider.
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: descOpacity,
            transform: `translateY(${descY}px)`,
          }}
        >
          {actionPills.map((pill, index) => {
            const pillScale = spring({
              frame: frame - (106 + index * 6),
              fps,
              config: { damping: 14, stiffness: 110 },
            });

            return (
              <div
                key={pill}
                style={{
                  padding: "11px 20px",
                  borderRadius: 999,
                  border: "1px solid hsla(180, 50%, 85%, 0.28)",
                  background: "linear-gradient(135deg, hsla(165, 70%, 55%, 0.2), hsla(190, 80%, 50%, 0.16))",
                  color: "hsl(195, 52%, 92%)",
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  transform: `scale(${pillScale})`,
                  boxShadow: "0 10px 26px -14px hsla(165, 70%, 55%, 0.6)",
                }}
              >
                {pill}
              </div>
            );
          })}
        </div>
      </div>

      <SceneTransition durationInFrames={180} type="slide" direction="both" color="hsl(196, 36%, 9%)" />
    </AbsoluteFill>
  );
};

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

  // Description animation
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
            fontSize: 26,
            color: "hsl(215, 20%, 65%)",
            margin: 0,
            opacity: introOpacity,
            transform: `translateY(${introY}px)`,
            textAlign: "center",
          }}
        >
          C'est pour répondre à ce problème que nous avons créé
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
            fontSize: 26,
            color: "hsl(215, 20%, 75%)",
            margin: 0,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.6,
            opacity: descOpacity,
            transform: `translateY(${descY}px)`,
          }}
        >
          Un système permettant de <span style={{ color: "hsl(165, 70%, 55%)" }}>collecter</span>,{" "}
          <span style={{ color: "hsl(190, 80%, 50%)" }}>traiter</span> et{" "}
          <span style={{ color: "hsl(220, 60%, 60%)" }}>visualiser</span>
          <br />
          des données de qualité de l'air, de manière claire et accessible.
        </p>
      </div>

      <SceneTransition durationInFrames={180} type="fade" direction="both" />
    </AbsoluteFill>
  );
};

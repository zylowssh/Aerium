import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig, Img, staticFile } from "remotion";
import { Github, Award, Sparkles } from "lucide-react";
import { AnimatedBackground, SceneTransition, WaveformVisualization } from "../components";

export const ConclusionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame: frame - 15,
    fps,
    config: { damping: 10, stiffness: 100, mass: 0.8 },
  });
  const logoRotation = interpolate(frame, [15, 35], [-3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleOpacity = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [35, 55], [35, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const sloganOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });
  const sloganY = interpolate(frame, [60, 80], [25, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const badgeOpacity = interpolate(frame, [95, 115], [0, 1], { extrapolateRight: "clamp" });
  const badgeScale = spring({
    frame: frame - 95,
    fps,
    config: { damping: 12, stiffness: 90 },
  });

  const glowIntensity = interpolate(frame % 60, [0, 30, 60], [0.5, 1, 0.5]);

  // Sparkle effects
  const sparkles = [
    { x: -320, y: -140, delay: 0 },
    { x: 340, y: -120, delay: 15 },
    { x: -280, y: 160, delay: 25 },
    { x: 300, y: 140, delay: 35 },
  ];

  return (
    <AbsoluteFill style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <AnimatedBackground variant="solution" particleCount={30} />

      {/* Large glowing orb */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsla(165, 70%, 55%, 0.2) 0%, transparent 50%)",
          opacity: glowIntensity,
          filter: "blur(100px)",
        }}
      />

      {/* Sparkles */}
      {sparkles.map((s, i) => {
        const sparkleOpacity = interpolate((frame + s.delay) % 50, [0, 25, 50], [0, 1, 0]);
        const sparkleScale = interpolate((frame + s.delay) % 50, [0, 25, 50], [0.5, 1, 0.5]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px)) scale(${sparkleScale})`,
              opacity: sparkleOpacity * 0.6,
            }}
          >
            <Sparkles size={20} color="hsl(165, 70%, 55%)" />
          </div>
        );
      })}

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          padding: 60,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            transform: `scale(${logoScale}) rotate(${logoRotation}deg)`,
          }}
        >
          <Img
            src={staticFile("favicon.png")}
            style={{
              width: 90,
              height: 90,
              filter: `drop-shadow(0 0 ${35 * glowIntensity}px hsla(165, 70%, 55%, 0.6))`,
            }}
          />
          <h1
            style={{
              fontSize: 72,
              fontWeight: 700,
              margin: 0,
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

        {/* Slogan */}
        <div
          style={{
            textAlign: "center",
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <p
            style={{
              fontSize: 40,
              fontWeight: 600,
              margin: 0,
              background: "linear-gradient(135deg, hsl(165, 70%, 55%) 0%, hsl(190, 80%, 50%) 50%, hsl(165, 60%, 45%) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Rendre l'invisible visible
          </p>
        </div>

        <p
          style={{
            fontSize: 24,
            color: "hsl(215, 20%, 72%)",
            margin: 0,
            textAlign: "center",
            opacity: sloganOpacity,
            transform: `translateY(${sloganY}px)`,
          }}
        >
          Comprendre l'air que l'on respire, grâce à la technologie
        </p>

        {/* Waveform */}
        <div
          style={{
            opacity: sloganOpacity * 0.8,
            marginTop: 10,
          }}
        >
          <WaveformVisualization
            barCount={40}
            width={400}
            height={50}
            color="hsl(165, 70%, 55%)"
          />
        </div>

        {/* NSI Badge 
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            marginTop: 15,
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 28px",
              borderRadius: 14,
              background: "hsla(220, 60%, 50%, 0.2)",
              border: "1px solid hsla(220, 60%, 50%, 0.4)",
              boxShadow: "0 0 30px hsla(220, 60%, 50%, 0.15)",
            }}
          >
            <Award size={20} color="hsl(220, 60%, 70%)" />
            <span
              style={{
                fontSize: 17,
                color: "hsl(220, 60%, 75%)",
                fontWeight: 500,
              }}
            >
              Projet présenté au Trophée NSI
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 22px",
              borderRadius: 12,
              background: "hsla(220, 20%, 12%, 0.9)",
              border: "1px solid hsla(210, 40%, 30%, 0.3)",
            }}
          >
            <Github size={18} color="hsl(210, 40%, 90%)" />
            <span
              style={{
                fontSize: 15,
                color: "hsl(210, 40%, 90%)",
              }}
            >
              github.com/zylowssh
            </span>
          </div>
        </div>
        */}
      </div>

      <SceneTransition durationInFrames={180} type="fade" direction="in" />
    </AbsoluteFill>
  );
};

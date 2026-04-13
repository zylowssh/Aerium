import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";
import { AnimatedBackground, SceneTransition } from "../components";

export const ConclusionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation
  const logoSpring = spring({
    frame: frame - 20,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  // Tagline animations
  const taglineOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sloganOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const accentColor = "#10b981";

  return (
    <AbsoluteFill style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif" }}>
      <AnimatedBackground variant="accent" />

      {/* Subtle glow behind logo */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -55%)",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}10 0%, transparent 70%)`,
          filter: "blur(80px)",
          opacity: logoSpring,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
        }}
      >
        {/* Logo + Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            opacity: logoSpring,
            transform: `scale(${interpolate(logoSpring, [0, 1], [0.9, 1])})`,
          }}
        >
          <Img
            src={staticFile("favicon.png")}
            style={{
              width: 72,
              height: 72,
            }}
          />

          <h1
            style={{
              fontSize: 64,
              fontWeight: 600,
              margin: 0,
              letterSpacing: "-0.03em",
            }}
          >
            <span style={{ color: "#fafafa" }}>Aer</span>
            <span style={{ color: accentColor }}>ium</span>
          </h1>
        </div>

        {/* Main tagline */}
        <p
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: accentColor,
            margin: "32px 0 0 0",
            opacity: taglineOpacity,
          }}
        >
          Rendre l'invisible visible
        </p>

        {/* Secondary slogan */}
        <p
          style={{
            fontSize: 20,
            fontWeight: 400,
            color: "rgba(250, 250, 250, 0.6)",
            margin: "20px 0 0 0",
            opacity: sloganOpacity,
          }}
        >
          Mesurer. Comprendre. Respirer mieux.
        </p>

        {/* Accent line */}
        <div
          style={{
            width: interpolate(frame, [100, 130], [0, 100], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            height: 2,
            backgroundColor: `${accentColor}60`,
            borderRadius: 1,
            marginTop: 40,
          }}
        />
      </div>

      <SceneTransition durationInFrames={180} type="fade" direction="in" />
    </AbsoluteFill>
  );
};

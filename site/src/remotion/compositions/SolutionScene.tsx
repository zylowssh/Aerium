import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig, Img, staticFile } from "remotion";
import { AnimatedBackground, SceneTransition } from "../components";

export const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation
  const logoSpring = spring({
    frame: frame - 25,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  // Brand name animation
  const brandSpring = spring({
    frame: frame - 40,
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  // Tagline
  const taglineOpacity = interpolate(frame, [70, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [70, 90], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Pills animation
  const pillsOpacity = interpolate(frame, [100, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pills = ["Collecter", "Analyser", "Agir"];

  // Accent color
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
          transform: "translate(-50%, -60%)",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
          filter: "blur(60px)",
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
        {/* Label */}
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: accentColor,
            marginBottom: 40,
            opacity: interpolate(frame, [15, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          La solution
        </span>

        {/* Logo + Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              opacity: logoSpring,
              transform: `scale(${logoSpring})`,
            }}
          >
            <Img
              src={staticFile("favicon.png")}
              style={{
                width: 80,
                height: 80,
              }}
            />
          </div>

          <h1
            style={{
              fontSize: 72,
              fontWeight: 600,
              margin: 0,
              letterSpacing: "-0.03em",
              opacity: brandSpring,
              transform: `translateX(${interpolate(brandSpring, [0, 1], [20, 0])}px)`,
            }}
          >
            <span style={{ color: "#fafafa" }}>Aer</span>
            <span style={{ color: accentColor }}>ium</span>
          </h1>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 24,
            fontWeight: 500,
            color: "rgba(250, 250, 250, 0.7)",
            margin: "32px 0 0 0",
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          Une plateforme visuelle pour la qualité de l'air
        </p>

        {/* Action pills */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 40,
            opacity: pillsOpacity,
          }}
        >
          {pills.map((pill, index) => {
            const pillSpring = spring({
              frame: frame - (105 + index * 8),
              fps,
              config: { damping: 18, stiffness: 120 },
            });

            return (
              <div
                key={pill}
                style={{
                  padding: "10px 20px",
                  borderRadius: 100,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "rgba(250, 250, 250, 0.9)",
                  fontSize: 15,
                  fontWeight: 500,
                  transform: `scale(${pillSpring})`,
                  opacity: pillSpring,
                }}
              >
                {pill}
              </div>
            );
          })}
        </div>
      </div>

      <SceneTransition durationInFrames={180} type="fade" direction="both" />
    </AbsoluteFill>
  );
};

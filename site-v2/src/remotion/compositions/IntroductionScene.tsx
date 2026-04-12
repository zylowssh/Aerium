import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { AnimatedBackground, SceneTransition } from "../components";

export const IntroductionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Staggered text animations with spring physics
  const labelSpring = spring({
    frame: frame - 20,
    fps,
    config: { damping: 20, stiffness: 120 },
  });

  const questionSpring = spring({
    frame: frame - 35,
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  const subtitleOpacity = interpolate(frame, [70, 90], [0, 1], { 
    extrapolateLeft: "clamp", 
    extrapolateRight: "clamp" 
  });
  const subtitleY = interpolate(frame, [70, 90], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const descriptionOpacity = interpolate(frame, [100, 120], [0, 1], { 
    extrapolateLeft: "clamp", 
    extrapolateRight: "clamp" 
  });

  // Accent line animation
  const lineWidth = interpolate(frame, [130, 160], [0, 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif" }}>
      <AnimatedBackground variant="accent" />

      {/* Content container */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          textAlign: "center",
        }}
      >
        {/* Label */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(16, 185, 129, 0.9)",
            marginBottom: 32,
            opacity: labelSpring,
            transform: `translateY(${interpolate(labelSpring, [0, 1], [15, 0])}px)`,
          }}
        >
          Projet Aerium
        </div>

        {/* Main question */}
        <h1
          style={{
            fontSize: 64,
            fontWeight: 600,
            lineHeight: 1.15,
            margin: 0,
            maxWidth: 900,
            color: "#fafafa",
            letterSpacing: "-0.02em",
            opacity: questionSpring,
            transform: `translateY(${interpolate(questionSpring, [0, 1], [30, 0])}px)`,
          }}
        >
          Et si nous pouvions voir l'air que nous respirons ?
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 28,
            fontWeight: 400,
            fontStyle: "italic",
            color: "rgba(250, 250, 250, 0.7)",
            margin: "28px 0 0 0",
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          Rendre l'invisible lisible.
        </p>

        {/* Accent line */}
        <div
          style={{
            width: lineWidth,
            height: 2,
            backgroundColor: "rgba(16, 185, 129, 0.6)",
            borderRadius: 1,
            marginTop: 40,
          }}
        />

        {/* Description */}
        <p
          style={{
            fontSize: 18,
            fontWeight: 400,
            lineHeight: 1.7,
            color: "rgba(250, 250, 250, 0.55)",
            margin: "32px 0 0 0",
            maxWidth: 700,
            opacity: descriptionOpacity,
          }}
        >
          La qualité de l'air influence notre santé, notre environnement, et notre quotidien.
          Pourtant, ces données restent souvent invisibles, complexes, ou inaccessibles.
        </p>
      </div>

      <SceneTransition durationInFrames={180} type="fade" direction="both" />
    </AbsoluteFill>
  );
};

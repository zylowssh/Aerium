import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { AnimatedBackground, SceneTransition, WaveformVisualization } from "../components";

export const IntroductionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Question animation with more dramatic entrance
  const questionOpacity = interpolate(frame, [15, 40], [0, 1], { extrapolateRight: "clamp" });
  const questionY = interpolate(frame, [15, 40], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  });
  const questionScale = spring({
    frame: frame - 15,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  // Answer animation
  const answerOpacity = interpolate(frame, [70, 95], [0, 1], { extrapolateRight: "clamp" });
  const answerY = interpolate(frame, [70, 95], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Secondary text animation
  const secondaryOpacity = interpolate(frame, [110, 130], [0, 1], { extrapolateRight: "clamp" });

  // Breathing ring effect
  const ringScale = interpolate(frame % 90, [0, 45, 90], [1, 1.15, 1]);
  const ringOpacity = interpolate(frame % 90, [0, 45, 90], [0.3, 0.6, 0.3]);

  // Waveform entrance
  const waveOpacity = interpolate(frame, [130, 150], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily: "'Manrope', 'Space Grotesk', sans-serif" }}>
      <AnimatedBackground variant="intro" particleCount={25} />

      {/* Breathing rings */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${ringScale * (1 + i * 0.1)})`,
            width: 400 + i * 150,
            height: 400 + i * 150,
            borderRadius: "50%",
            border: `1px solid hsla(165, 70%, 55%, ${0.15 - i * 0.04})`,
            opacity: ringOpacity * (1 - i * 0.3),
          }}
        />
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
          gap: 40,
          padding: 80,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 20,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "hsla(180, 36%, 86%, 0.72)",
            marginBottom: -10,
            opacity: interpolate(frame, [0, 24], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          Projet Aerium
        </div>

        {/* Main question */}
        <h1
          style={{
            fontSize: 60,
            fontWeight: 700,
            margin: 0,
            opacity: questionOpacity,
            transform: `translateY(${questionY}px) scale(${questionScale})`,
            background: "linear-gradient(130deg, hsl(161, 80%, 66%) 0%, hsl(188, 90%, 67%) 48%, hsl(201, 88%, 73%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1.2,
            maxWidth: 1100,
          }}
        >
          Et si nous pouvions voir l'air que nous respirons ?
        </h1>

        <p
          style={{
            fontSize: 40,
            color: "hsla(188, 48%, 85%, 0.95)",
            margin: 0,
            maxWidth: 980,
            letterSpacing: 0.1,
            fontStyle: "italic",
            fontFamily: "'Times New Roman', serif",
            opacity: interpolate(frame, [44, 72], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(frame, [44, 72], [24, 0], { extrapolateRight: "clamp" })}px)`,
          }}
        >
          Rendre l'invisible lisible.
        </p>

        {/* Answer text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            opacity: answerOpacity,
            transform: `translateY(${answerY}px)`,
          }}
        >
          <p
            style={{
              fontSize: 28,
              color: "hsla(205, 48%, 92%, 0.98)",
              margin: 0,
              lineHeight: 1.6,
              maxWidth: 1150,
            }}
          >
            La qualité de l'air influence notre santé, notre environnement, et notre quotidien.
          </p>
          <p
            style={{
              fontSize: 24,
              color: "hsla(199, 36%, 74%, 0.85)",
              margin: 0,
              lineHeight: 1.5,
              opacity: secondaryOpacity,
              maxWidth: 1150,
            }}
          >
            Pourtant, ces données restent souvent invisibles, complexes, ou inaccessibles.
          </p>
        </div>

        {/* Audio waveform visualization */}
        <div style={{ opacity: waveOpacity, marginTop: 20 }}>
          <WaveformVisualization
            barCount={50}
            width={500}
            height={60}
            color="hsl(168, 78%, 60%)"
          />
        </div>
      </div>

      {/* Scene transitions */}
      <SceneTransition durationInFrames={180} type="zoom" direction="both" color="hsl(206, 34%, 8%)" />
    </AbsoluteFill>
  );
};

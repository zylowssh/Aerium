import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { AnimatedBackground, GlowingText, SceneTransition, WaveformVisualization } from "../components";

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
    <AbsoluteFill style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
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
        {/* Main question */}
        <h1
          style={{
            fontSize: 60,
            fontWeight: 700,
            margin: 0,
            opacity: questionOpacity,
            transform: `translateY(${questionY}px) scale(${questionScale})`,
            background: "linear-gradient(135deg, hsl(165, 70%, 55%) 0%, hsl(190, 80%, 50%) 50%, hsl(165, 60%, 45%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1.2,
            maxWidth: 1100,
          }}
        >
          Et si nous pouvions voir l'air que nous respirons ?
        </h1>

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
              color: "hsl(210, 40%, 90%)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            La qualité de l'air influence notre santé, notre environnement, et notre quotidien.
          </p>
          <p
            style={{
              fontSize: 24,
              color: "hsl(215, 20%, 55%)",
              margin: 0,
              lineHeight: 1.5,
              opacity: secondaryOpacity,
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
            color="hsl(165, 70%, 55%)"
          />
        </div>
      </div>

      {/* Scene transitions */}
      <SceneTransition durationInFrames={180} type="fade" direction="both" />
    </AbsoluteFill>
  );
};

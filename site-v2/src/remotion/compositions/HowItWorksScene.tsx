import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { Cpu, Server, Monitor, Zap } from "lucide-react";
import { AnimatedBackground, SceneTransition, FlowingConnector } from "../components";

const steps = [
  { icon: Cpu, text: "Capteurs IoT", subtext: "Mesure de la qualité de l'air", color: "hsl(165, 70%, 55%)" },
  { icon: Server, text: "Serveur", subtext: "Traitement des données", color: "hsl(190, 80%, 50%)" },
  { icon: Monitor, text: "Interface", subtext: "Affichage en temps réel", color: "hsl(220, 60%, 55%)" },
];

export const HowItWorksScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [10, 30], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  });

  // Data flow animation
  const flowProgress = interpolate(frame, [80, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <AnimatedBackground variant="default" particleCount={18} />

      {/* Flowing data lines in background */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.15,
        }}
      >
        {[...Array(5)].map((_, i) => {
          const yPos = 300 + i * 120;
          const dashOffset = (frame * 2 + i * 50) % 1000;
          return (
            <path
              key={i}
              d={`M -100 ${yPos} Q 400 ${yPos + 50} 960 ${yPos} Q 1520 ${yPos - 50} 2020 ${yPos}`}
              fill="none"
              stroke="hsl(165, 70%, 55%)"
              strokeWidth="1"
              strokeDasharray="10 20"
              strokeDashoffset={-dashOffset}
            />
          );
        })}
      </svg>

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 60,
          padding: 60,
        }}
      >
        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <Zap size={32} color="hsl(165, 70%, 55%)" />
          <h2 style={{ fontSize: 52, fontWeight: 700, margin: 0 }}>
            <span style={{ color: "hsl(210, 40%, 98%)" }}>Comment </span>
            <span
              style={{
                background: "linear-gradient(135deg, hsl(165, 70%, 55%) 0%, hsl(190, 80%, 50%) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ça fonctionne
            </span>
          </h2>
        </div>

        {/* Steps in a row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
          }}
        >
          {steps.map((step, index) => {
            const delay = 40 + index * 25;
            const scale = spring({
              frame: frame - delay,
              fps,
              config: { damping: 12, stiffness: 90 },
            });
            const opacity = interpolate(frame - delay, [0, 20], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const yOffset = interpolate(frame - delay, [0, 25], [30, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            const Icon = step.icon;
            const glowIntensity = interpolate((frame + index * 30) % 90, [0, 45, 90], [0.4, 0.8, 0.4]);

            return (
              <div key={index} style={{ display: "flex", alignItems: "center" }}>
                {/* Card */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                    padding: "32px 28px",
                    borderRadius: 24,
                    background: "hsla(220, 20%, 8%, 0.95)",
                    border: `1px solid ${step.color}40`,
                    backdropFilter: "blur(20px)",
                    transform: `scale(${scale}) translateY(${yOffset}px)`,
                    opacity,
                    width: 260,
                    textAlign: "center",
                    boxShadow: `
                      0 0 ${35 * glowIntensity}px ${step.color}25,
                      0 15px 50px -15px hsla(220, 30%, 0%, 0.6),
                      inset 0 1px 0 hsla(210, 40%, 98%, 0.08)
                    `,
                  }}
                >
                  {/* Step number */}
                  <div
                    style={{
                      position: "absolute",
                      top: -12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: step.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "hsl(220, 30%, 5%)",
                      boxShadow: `0 0 15px ${step.color}60`,
                    }}
                  >
                    {index + 1}
                  </div>

                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 18,
                      background: `${step.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 0 25px ${step.color}30`,
                    }}
                  >
                    <Icon size={36} color={step.color} />
                  </div>
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 600,
                      color: step.color,
                    }}
                  >
                    {step.text}
                  </span>
                  <span
                    style={{
                      fontSize: 15,
                      color: "hsl(215, 20%, 60%)",
                      lineHeight: 1.4,
                    }}
                  >
                    {step.subtext}
                  </span>
                </div>

                {/* Connector */}
                {index < steps.length - 1 && (
                  <div style={{ margin: "0 8px" }}>
                    <FlowingConnector
                      startDelay={delay + 20}
                      duration={30}
                      color={step.color}
                      direction="horizontal"
                      length={70}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SceneTransition durationInFrames={180} type="fade" direction="both" />
    </AbsoluteFill>
  );
};

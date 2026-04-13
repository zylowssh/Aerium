import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { Cpu, Server, Monitor } from "lucide-react";
import { AnimatedBackground, SceneTransition } from "../components";

const steps = [
  { icon: Cpu, label: "Capteurs IoT", description: "Mesure de la qualité de l'air" },
  { icon: Server, label: "Serveur", description: "Traitement des données" },
  { icon: Monitor, label: "Interface", description: "Affichage en temps réel" },
];

export const HowItWorksScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  const accentColor = "#10b981";

  return (
    <AbsoluteFill style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif" }}>
      <AnimatedBackground variant="accent" />

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
        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            marginBottom: 64,
            opacity: titleSpring,
            transform: `translateY(${interpolate(titleSpring, [0, 1], [25, 0])}px)`,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: accentColor,
            }}
          >
            Architecture
          </span>
          <h2
            style={{
              fontSize: 48,
              fontWeight: 600,
              margin: 0,
              color: "#fafafa",
              letterSpacing: "-0.02em",
            }}
          >
            Comment ça fonctionne
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
            const delay = 40 + index * 20;
            
            const cardSpring = spring({
              frame: frame - delay,
              fps,
              config: { damping: 16, stiffness: 100 },
            });

            const Icon = step.icon;

            // Connector line animation
            const lineProgress = interpolate(frame - (delay + 15), [0, 20], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });

            return (
              <div key={index} style={{ display: "flex", alignItems: "center" }}>
                {/* Card */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                    padding: "32px 24px",
                    width: 220,
                    borderRadius: 16,
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    opacity: cardSpring,
                    transform: `translateY(${interpolate(cardSpring, [0, 1], [30, 0])}px)`,
                    textAlign: "center",
                  }}
                >
                  {/* Step number */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: accentColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#09090b",
                      marginBottom: 4,
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      backgroundColor: `${accentColor}12`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={28} color={accentColor} strokeWidth={1.5} />
                  </div>

                  {/* Label */}
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#fafafa",
                    }}
                  >
                    {step.label}
                  </span>

                  {/* Description */}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 400,
                      color: "rgba(250, 250, 250, 0.5)",
                      lineHeight: 1.4,
                    }}
                  >
                    {step.description}
                  </span>
                </div>

                {/* Connector */}
                {index < steps.length - 1 && (
                  <div
                    style={{
                      width: 60,
                      height: 2,
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: "100%",
                        width: `${lineProgress * 100}%`,
                        backgroundColor: accentColor,
                      }}
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

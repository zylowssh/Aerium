import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { Database, Cpu, BarChart3, Radio } from "lucide-react";
import { AnimatedBackground, SceneTransition } from "../components";

const architectureElements = [
  { name: "Capteurs", description: "Réception des données", icon: Radio },
  { name: "Traitement", description: "Analyse en temps réel", icon: Cpu },
  { name: "Stockage", description: "Conservation historique", icon: Database },
  { name: "Interface", description: "Lecture instantanée", icon: BarChart3 },
];

export const TechStackScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  const accentColor = "#10b981";

  // Conclusion text
  const conclusionOpacity = interpolate(frame, [120, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
            marginBottom: 56,
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
            Infrastructure
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
            Architecture Technique
          </h2>
        </div>

        {/* Architecture flow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
          }}
        >
          {architectureElements.map((element, index) => {
            const delay = 45 + index * 15;
            
            const cardSpring = spring({
              frame: frame - delay,
              fps,
              config: { damping: 16, stiffness: 100 },
            });

            const IconComponent = element.icon;

            // Connector line animation
            const lineProgress = interpolate(frame - (delay + 12), [0, 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });

            return (
              <div key={element.name} style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 14,
                    padding: "28px 20px",
                    width: 180,
                    borderRadius: 16,
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    opacity: cardSpring,
                    transform: `translateY(${interpolate(cardSpring, [0, 1], [30, 0])}px)`,
                    textAlign: "center",
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      backgroundColor: `${accentColor}12`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconComponent size={26} color={accentColor} strokeWidth={1.5} />
                  </div>

                  {/* Name */}
                  <span
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: "#fafafa",
                    }}
                  >
                    {element.name}
                  </span>

                  {/* Description */}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 400,
                      color: "rgba(250, 250, 250, 0.5)",
                      lineHeight: 1.4,
                    }}
                  >
                    {element.description}
                  </span>
                </div>

                {/* Connector */}
                {index < architectureElements.length - 1 && (
                  <div
                    style={{
                      width: 48,
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

        {/* Conclusion */}
        <p
          style={{
            fontSize: 16,
            fontWeight: 400,
            color: "rgba(250, 250, 250, 0.5)",
            textAlign: "center",
            maxWidth: 600,
            marginTop: 48,
            opacity: conclusionOpacity,
            lineHeight: 1.6,
          }}
        >
          Chaque élément communique pour transformer des mesures brutes en{" "}
          <span style={{ color: accentColor, fontWeight: 500 }}>
            informations compréhensibles
          </span>
        </p>
      </div>

      <SceneTransition durationInFrames={180} type="fade" direction="both" />
    </AbsoluteFill>
  );
};

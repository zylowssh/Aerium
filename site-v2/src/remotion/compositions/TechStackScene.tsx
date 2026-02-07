import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { Database, Cpu, BarChart3, Radio, Settings, ArrowRight } from "lucide-react";
import { AnimatedBackground, SceneTransition, FlowingConnector } from "../components";

const architectureElements = [
  { name: "Capteurs", description: "Réception des données", icon: Radio, color: "hsl(165, 70%, 55%)" },
  { name: "Traitement", description: "Analyse en temps réel", icon: Cpu, color: "hsl(200, 80%, 55%)" },
  { name: "Stockage", description: "Conservation historique", icon: Database, color: "hsl(260, 60%, 60%)" },
  { name: "Interface", description: "Lecture instantanée", icon: BarChart3, color: "hsl(45, 90%, 55%)" },
];

export const TechStackScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [10, 30], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  });

  const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const conclusionOpacity = interpolate(frame, [130, 150], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <AnimatedBackground variant="default" particleCount={20} />

      {/* Circuit-like pattern in background */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.04,
        }}
      >
        {[...Array(8)].map((_, i) => {
          const y = 100 + i * 130;
          return (
            <g key={i}>
              <line
                x1="0"
                y1={y}
                x2="1920"
                y2={y}
                stroke="hsl(165, 70%, 55%)"
                strokeWidth="1"
                strokeDasharray="5 10"
              />
              {[...Array(15)].map((_, j) => (
                <circle
                  key={j}
                  cx={100 + j * 130}
                  cy={y}
                  r="3"
                  fill="hsl(165, 70%, 55%)"
                />
              ))}
            </g>
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
          gap: 40,
          padding: 60,
        }}
      >
        {/* Title */}
        <div
          style={{
            textAlign: "center",
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <Settings size={32} color="hsl(165, 70%, 55%)" />
            <h2 style={{ fontSize: 52, fontWeight: 700, margin: 0 }}>
              <span style={{ color: "hsl(210, 40%, 98%)" }}>Architecture </span>
              <span
                style={{
                  background: "linear-gradient(135deg, hsl(165, 70%, 55%) 0%, hsl(190, 80%, 50%) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Technique
              </span>
            </h2>
          </div>
          <p
            style={{
              fontSize: 22,
              color: "hsl(215, 20%, 60%)",
              margin: 0,
              marginTop: 12,
              opacity: subtitleOpacity,
            }}
          >
            Une architecture complète pour faire fonctionner Aerium
          </p>
        </div>

        {/* Architecture diagram */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            position: "relative",
          }}
        >
          {architectureElements.map((element, index) => {
            const delay = 50 + index * 15;
            const scale = spring({
              frame: frame - delay,
              fps,
              config: { damping: 14, stiffness: 100 },
            });
            const opacity = interpolate(frame - delay, [0, 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const yOffset = spring({
              frame: frame - delay,
              fps,
              config: { damping: 12, stiffness: 80 },
            });

            const IconComponent = element.icon;
            const glowIntensity = interpolate((frame + index * 25) % 80, [0, 40, 80], [0.4, 0.8, 0.4]);

            return (
              <div key={element.name} style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 14,
                    padding: "26px 22px",
                    borderRadius: 20,
                    background: "hsla(220, 20%, 8%, 0.95)",
                    border: `1px solid ${element.color}50`,
                    backdropFilter: "blur(20px)",
                    transform: `scale(${scale}) translateY(${(1 - yOffset) * 20}px)`,
                    opacity,
                    width: 175,
                    textAlign: "center",
                    boxShadow: `
                      0 0 ${30 * glowIntensity}px ${element.color}25,
                      0 15px 45px -15px hsla(220, 30%, 0%, 0.6),
                      inset 0 1px 0 hsla(210, 40%, 98%, 0.08)
                    `,
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 15,
                      background: `${element.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 0 20px ${element.color}35`,
                    }}
                  >
                    <IconComponent size={30} color={element.color} />
                  </div>
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: element.color,
                    }}
                  >
                    {element.name}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: "hsl(215, 20%, 60%)",
                      lineHeight: 1.3,
                    }}
                  >
                    {element.description}
                  </span>
                </div>
                {/* Connector */}
                {index < architectureElements.length - 1 && (
                  <div style={{ margin: "0 6px" }}>
                    <FlowingConnector
                      startDelay={delay + 12}
                      duration={25}
                      color={element.color}
                      direction="horizontal"
                      length={50}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Conclusion text */}
        <p
          style={{
            fontSize: 20,
            color: "hsl(215, 20%, 68%)",
            textAlign: "center",
            maxWidth: 800,
            margin: 0,
            marginTop: 10,
            opacity: conclusionOpacity,
            lineHeight: 1.6,
          }}
        >
          Chaque élément communique pour transformer
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, hsl(165, 70%, 55%), hsl(190, 80%, 50%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 600,
            }}
          >
            des mesures brutes en informations compréhensibles
          </span>
        </p>
      </div>

      <SceneTransition durationInFrames={180} type="fade" direction="both" />
    </AbsoluteFill>
  );
};

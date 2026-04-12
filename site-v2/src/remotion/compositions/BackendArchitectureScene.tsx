import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { Globe, Zap, Lock, Database } from "lucide-react";
import { AnimatedBackground, SceneTransition } from "../components";

const backendLayers = [
  { name: "Client React", description: "Interface utilisateur", icon: Globe },
  { name: "Backend Flask", description: "API REST + WebSockets", icon: Zap },
  { name: "Auth", description: "JWT & Sessions", icon: Lock },
  { name: "SQLite", description: "Base de données", icon: Database },
];

const features = [
  { label: "Temps réel", desc: "WebSockets" },
  { label: "Python", desc: "Backend" },
  { label: "TypeScript", desc: "Frontend" },
];

export const BackendArchitectureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  const accentColor = "#10b981";

  // Features animation
  const featuresOpacity = interpolate(frame, [130, 150], [0, 1], {
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
            marginBottom: 48,
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
            Stack Technique
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
            Architecture Backend
          </h2>
          <p
            style={{
              fontSize: 16,
              fontWeight: 400,
              color: "rgba(250, 250, 250, 0.5)",
              margin: "4px 0 0 0",
              opacity: interpolate(titleSpring, [0.5, 1], [0, 1], { extrapolateLeft: "clamp" }),
            }}
          >
            React + Flask — API REST avec WebSockets en temps réel
          </p>
        </div>

        {/* Architecture flow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
          }}
        >
          {backendLayers.map((layer, index) => {
            const delay = 50 + index * 15;
            
            const cardSpring = spring({
              frame: frame - delay,
              fps,
              config: { damping: 16, stiffness: 100 },
            });

            const IconComponent = layer.icon;

            // Connector line animation
            const lineProgress = interpolate(frame - (delay + 12), [0, 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });

            return (
              <div key={layer.name} style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    padding: "24px 18px",
                    width: 150,
                    borderRadius: 14,
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    opacity: cardSpring,
                    transform: `translateY(${interpolate(cardSpring, [0, 1], [25, 0])}px)`,
                    textAlign: "center",
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: `${accentColor}12`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconComponent size={24} color={accentColor} strokeWidth={1.5} />
                  </div>

                  {/* Name */}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#fafafa",
                    }}
                  >
                    {layer.name}
                  </span>

                  {/* Description */}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 400,
                      color: "rgba(250, 250, 250, 0.5)",
                      lineHeight: 1.3,
                    }}
                  >
                    {layer.description}
                  </span>
                </div>

                {/* Connector */}
                {index < backendLayers.length - 1 && (
                  <div
                    style={{
                      width: 40,
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

        {/* Features badges */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 40,
            opacity: featuresOpacity,
          }}
        >
          {features.map((feat) => (
            <div
              key={feat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "12px 20px",
                borderRadius: 10,
                backgroundColor: `${accentColor}08`,
                border: `1px solid ${accentColor}20`,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: accentColor,
                }}
              >
                {feat.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(250, 250, 250, 0.5)",
                }}
              >
                {feat.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      <SceneTransition durationInFrames={180} type="fade" direction="both" />
    </AbsoluteFill>
  );
};

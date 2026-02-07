import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { Server, Cloud, Zap, Lock, Globe, Database, ArrowRight } from "lucide-react";
import { AnimatedBackground, SceneTransition, FlowingConnector } from "../components";

const backendLayers = [
  {
    name: "Client React",
    description: "Interface utilisateur",
    icon: Globe,
    color: "hsl(200, 80%, 55%)",
  },
  {
    name: "Backend Flask",
    description: "API REST + WebSockets",
    icon: Zap,
    color: "hsl(165, 70%, 55%)",
  },
  {
    name: "Authentification",
    description: "JWT & Sessions",
    icon: Lock,
    color: "hsl(45, 90%, 55%)",
  },
  {
    name: "SQLite",
    description: "Base de données",
    icon: Database,
    color: "hsl(260, 60%, 55%)",
  },
];

const features = [
  { label: "Temps réel", desc: "WebSockets Python" },
  { label: "Python", desc: "Backend performant" },
  { label: "TypeScript", desc: "Frontend type-safe" },
];

export const BackendArchitectureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [10, 30], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  });

  const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const featuresOpacity = interpolate(frame, [130, 150], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <AnimatedBackground variant="default" particleCount={18} />

      {/* Flowing lines background */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.1,
        }}
      >
        {[...Array(5)].map((_, i) => {
          const dashOffset = (frame * 1.5 + i * 100) % 500;
          return (
            <path
              key={i}
              d={`M 0 ${400 + i * 80} Q 480 ${350 + i * 80} 960 ${400 + i * 80} Q 1440 ${450 + i * 80} 1920 ${400 + i * 80}`}
              fill="none"
              stroke="hsl(165, 70%, 55%)"
              strokeWidth="1"
              strokeDasharray="8 16"
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
          gap: 35,
          padding: 50,
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
            <Server size={36} color="hsl(165, 70%, 55%)" />
            <h2 style={{ fontSize: 48, fontWeight: 700, margin: 0 }}>
              <span style={{ color: "hsl(210, 40%, 98%)" }}>Architecture </span>
              <span
                style={{
                  background: "linear-gradient(135deg, hsl(165, 70%, 55%) 0%, hsl(190, 80%, 50%) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Backend
              </span>
            </h2>
          </div>
          <p
            style={{
              fontSize: 20,
              color: "hsl(215, 20%, 60%)",
              margin: 0,
              marginTop: 10,
              opacity: subtitleOpacity,
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

            const IconComponent = layer.icon;
            const glowIntensity = interpolate((frame + index * 25) % 80, [0, 40, 80], [0.4, 0.8, 0.4]);

            return (
              <div key={layer.name} style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    padding: "24px 20px",
                    borderRadius: 18,
                    background: "hsla(220, 20%, 8%, 0.95)",
                    border: `1px solid ${layer.color}40`,
                    backdropFilter: "blur(20px)",
                    transform: `scale(${scale}) translateY(${(1 - yOffset) * 20}px)`,
                    opacity,
                    width: 160,
                    textAlign: "center",
                    boxShadow: `
                      0 0 ${30 * glowIntensity}px ${layer.color}20,
                      0 15px 45px -15px hsla(220, 30%, 0%, 0.6),
                      inset 0 1px 0 hsla(210, 40%, 98%, 0.06)
                    `,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      background: `${layer.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 0 20px ${layer.color}30`,
                    }}
                  >
                    <IconComponent size={28} color={layer.color} />
                  </div>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: layer.color,
                    }}
                  >
                    {layer.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "hsl(215, 20%, 58%)",
                      lineHeight: 1.3,
                    }}
                  >
                    {layer.description}
                  </span>
                </div>
                {/* Connector */}
                {index < backendLayers.length - 1 && (
                  <div style={{ margin: "0 8px" }}>
                    <FlowingConnector
                      startDelay={delay + 12}
                      duration={25}
                      color={layer.color}
                      direction="horizontal"
                      length={45}
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
            gap: 20,
            opacity: featuresOpacity,
          }}
        >
          {features.map((feat, i) => (
            <div
              key={feat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "14px 24px",
                borderRadius: 12,
                background: "hsla(165, 70%, 55%, 0.08)",
                border: "1px solid hsla(165, 70%, 55%, 0.25)",
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "hsl(165, 70%, 55%)",
                }}
              >
                {feat.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "hsl(215, 20%, 60%)",
                }}
              >
                {feat.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      <SceneTransition durationInFrames={180} type="fade" direction="in" />
    </AbsoluteFill>
  );
};

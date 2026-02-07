import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { Activity, Clock, MapPin, Smartphone, Layers } from "lucide-react";
import { AnimatedBackground, SceneTransition } from "../components";

const features = [
  { icon: Activity, title: "Mesures en temps réel", color: "hsl(165, 70%, 55%)" },
  { icon: Clock, title: "Historique des données", color: "hsl(190, 80%, 50%)" },
  { icon: MapPin, title: "Comparaison entre lieux", color: "hsl(220, 60%, 55%)" },
  { icon: Smartphone, title: "Interface intuitive", color: "hsl(260, 60%, 55%)" },
];

export const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [10, 30], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  });

  return (
    <AbsoluteFill style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <AnimatedBackground variant="default" particleCount={22} />

      {/* Decorative hexagon grid */}
      <svg
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          height: 800,
          opacity: 0.05,
        }}
      >
        {[...Array(6)].map((_, i) => {
          const angle = (i * 60 * Math.PI) / 180;
          const x = 400 + Math.cos(angle) * 250;
          const y = 400 + Math.sin(angle) * 250;
          return (
            <polygon
              key={i}
              points={`${x},${y - 50} ${x + 43},${y - 25} ${x + 43},${y + 25} ${x},${y + 50} ${x - 43},${y + 25} ${x - 43},${y - 25}`}
              fill="none"
              stroke="hsl(165, 70%, 55%)"
              strokeWidth="1"
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
          gap: 50,
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
          <Layers size={32} color="hsl(165, 70%, 55%)" />
          <h2 style={{ fontSize: 52, fontWeight: 700, margin: 0 }}>
            <span style={{ color: "hsl(210, 40%, 98%)" }}>Fonctionnalités </span>
            <span
              style={{
                background: "linear-gradient(135deg, hsl(165, 70%, 55%) 0%, hsl(190, 80%, 50%) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Principales
            </span>
          </h2>
        </div>

        {/* Feature cards in grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 24,
          }}
        >
          {features.map((feature, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            const delay = 35 + index * 12;

            const scale = spring({
              frame: frame - delay,
              fps,
              config: { damping: 14, stiffness: 100 },
            });
            const opacity = interpolate(frame - delay, [0, 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const slideX = interpolate(frame - delay, [0, 20], [col === 0 ? -30 : 30, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            const slideY = interpolate(frame - delay, [0, 20], [row === 0 ? -20 : 20, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });

            const Icon = feature.icon;
            const glowIntensity = interpolate((frame + index * 25) % 80, [0, 40, 80], [0.35, 0.7, 0.35]);

            return (
              <div
                key={feature.title}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  padding: "32px 40px",
                  borderRadius: 24,
                  background: "hsla(220, 20%, 8%, 0.95)",
                  border: `1px solid ${feature.color}40`,
                  backdropFilter: "blur(20px)",
                  transform: `scale(${scale}) translate(${slideX}px, ${slideY}px)`,
                  opacity,
                  width: 300,
                  textAlign: "center",
                  boxShadow: `
                    0 0 ${30 * glowIntensity}px ${feature.color}20,
                    0 15px 50px -15px hsla(220, 30%, 0%, 0.6),
                    inset 0 1px 0 hsla(210, 40%, 98%, 0.06)
                  `,
                }}
              >
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 17,
                    background: `${feature.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 0 20px ${feature.color}30`,
                  }}
                >
                  <Icon size={34} color={feature.color} />
                </div>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "hsl(210, 40%, 98%)",
                  }}
                >
                  {feature.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <SceneTransition durationInFrames={150} type="fade" direction="both" />
    </AbsoluteFill>
  );
};

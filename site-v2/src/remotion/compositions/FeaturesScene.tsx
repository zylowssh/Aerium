import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Activity, Clock, MapPin, Smartphone } from "lucide-react";
import { AnimatedBackground, SceneTransition } from "../components";

const features = [
  { icon: Activity, title: "Mesures en temps réel" },
  { icon: Clock, title: "Historique des données" },
  { icon: MapPin, title: "Comparaison entre lieux" },
  { icon: Smartphone, title: "Interface intuitive" },
];

export const FeaturesScene: React.FC = () => {
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
            Capacités
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
            Fonctionnalités Principales
          </h2>
        </div>

        {/* Feature grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 20,
          }}
        >
          {features.map((feature, index) => {
            const delay = 40 + index * 12;
            
            const cardSpring = spring({
              frame: frame - delay,
              fps,
              config: { damping: 16, stiffness: 110 },
            });

            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "24px 28px",
                  width: 320,
                  borderRadius: 14,
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  opacity: cardSpring,
                  transform: `scale(${interpolate(cardSpring, [0, 1], [0.95, 1])})`,
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
                    flexShrink: 0,
                  }}
                >
                  <Icon size={24} color={accentColor} strokeWidth={1.5} />
                </div>

                {/* Title */}
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 500,
                    color: "#fafafa",
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

import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { MapPin, Clock, XCircle } from "lucide-react";
import { AnimatedBackground, SceneTransition } from "../components";

const problems = [
  { icon: MapPin, label: "Couverture locale", value: "Faible" },
  { icon: Clock, label: "Données en direct", value: "Limitées" },
  { icon: XCircle, label: "Lecture publique", value: "Complexe" },
];

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  // Accent color for problem theme
  const accentColor = "#f97316";

  return (
    <AbsoluteFill style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif" }}>
      <AnimatedBackground variant="warm" />

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
            marginBottom: 60,
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
            Le problème
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
            Constat Terrain
          </h2>
        </div>

        {/* Problem cards */}
        <div
          style={{
            display: "flex",
            gap: 24,
          }}
        >
          {problems.map((problem, index) => {
            const delay = 40 + index * 15;
            
            const cardSpring = spring({
              frame: frame - delay,
              fps,
              config: { damping: 16, stiffness: 100 },
            });

            const Icon = problem.icon;

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 20,
                  padding: 32,
                  width: 280,
                  borderRadius: 16,
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  opacity: cardSpring,
                  transform: `translateY(${interpolate(cardSpring, [0, 1], [40, 0])}px)`,
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: `${accentColor}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={24} color={accentColor} strokeWidth={1.5} />
                </div>

                {/* Label */}
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "rgba(250, 250, 250, 0.5)",
                    letterSpacing: "0.01em",
                  }}
                >
                  {problem.label}
                </span>

                {/* Value */}
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 600,
                    color: "#fafafa",
                    letterSpacing: "-0.02em",
                    marginTop: -8,
                  }}
                >
                  {problem.value}
                </span>

                {/* Progress bar */}
                <div
                  style={{
                    width: "100%",
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    overflow: "hidden",
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      width: `${interpolate(frame - delay, [0, 30], [0, 100], { 
                        extrapolateLeft: "clamp", 
                        extrapolateRight: "clamp",
                        easing: Easing.out(Easing.cubic),
                      })}%`,
                      height: "100%",
                      backgroundColor: accentColor,
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <SceneTransition durationInFrames={150} type="fade" direction="both" />
    </AbsoluteFill>
  );
};

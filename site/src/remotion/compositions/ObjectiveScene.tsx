import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { Eye, Users, GitBranch } from "lucide-react";
import { AnimatedBackground, SceneTransition } from "../components";

const objectives = [
  { icon: Eye, text: "Rendre visibles des données invisibles" },
  { icon: Users, text: "Permettre à chacun de comprendre son environnement" },
  { icon: GitBranch, text: "Proposer une solution open-source et modulaire" },
];

export const ObjectiveScene: React.FC = () => {
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
            Notre mission
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
            Objectifs du Projet
          </h2>
        </div>

        {/* Objectives list */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 700,
          }}
        >
          {objectives.map((obj, index) => {
            const delay = 40 + index * 18;
            
            const itemSpring = spring({
              frame: frame - delay,
              fps,
              config: { damping: 16, stiffness: 100 },
            });

            const Icon = obj.icon;

            // Line drawing animation
            const lineProgress = interpolate(frame - delay, [0, 25], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "20px 24px",
                  borderRadius: 12,
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  opacity: itemSpring,
                  transform: `translateX(${interpolate(itemSpring, [0, 1], [-30, 0])}px)`,
                }}
              >
                {/* Number indicator */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: `${accentColor}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color={accentColor} strokeWidth={1.5} />
                </div>

                {/* Text */}
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 450,
                    color: "rgba(250, 250, 250, 0.85)",
                    flex: 1,
                  }}
                >
                  {obj.text}
                </span>

                {/* Progress indicator */}
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: `2px solid ${accentColor}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: accentColor,
                      transform: `scale(${lineProgress})`,
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

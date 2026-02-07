import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { Eye, Users, GitBranch, Target } from "lucide-react";
import { AnimatedBackground, SceneTransition, FlowingConnector } from "../components";

const objectives = [
  { icon: Eye, text: "Rendre visibles des données invisibles", color: "hsl(165, 70%, 55%)", emoji: "👁️" },
  { icon: Users, text: "Permettre à chacun de comprendre l'environnement qui l'entoure", color: "hsl(190, 80%, 50%)", emoji: "👥" },
  { icon: GitBranch, text: "Proposer une solution open-source, modulaire et évolutive", color: "hsl(220, 60%, 55%)", emoji: "🔗" },
];

export const ObjectiveScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [10, 30], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  });
  const titleScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  return (
    <AbsoluteFill style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <AnimatedBackground variant="default" particleCount={20} />

      {/* Decorative rings */}
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 900 + i * 150,
            height: 900 + i * 150,
            borderRadius: "50%",
            border: `1px solid hsla(165, 70%, 55%, ${0.08 - i * 0.03})`,
            opacity: 0.5,
          }}
        />
      ))}

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
            gap: 20,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px) scale(${titleScale})`,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "hsla(165, 70%, 55%, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 30px hsla(165, 70%, 55%, 0.3)",
            }}
          >
            <Target size={28} color="hsl(165, 70%, 55%)" />
          </div>
          <h2 style={{ fontSize: 52, fontWeight: 700, margin: 0 }}>
            <span style={{ color: "hsl(210, 40%, 98%)" }}>Objectif du </span>
            <span
              style={{
                background: "linear-gradient(135deg, hsl(165, 70%, 55%) 0%, hsl(190, 80%, 50%) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Projet
            </span>
          </h2>
        </div>

        {/* Objectives with connectors */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {objectives.map((obj, index) => {
            const delay = 40 + index * 22;
            const scale = spring({
              frame: frame - delay,
              fps,
              config: { damping: 15, stiffness: 100 },
            });
            const opacity = interpolate(frame - delay, [0, 20], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const slideX = interpolate(frame - delay, [0, 20], [index % 2 === 0 ? -40 : 40, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            const Icon = obj.icon;
            const glowIntensity = interpolate((frame + index * 20) % 90, [0, 45, 90], [0.3, 0.6, 0.3]);

            return (
              <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    padding: "20px 28px",
                    borderRadius: 18,
                    background: "hsla(220, 20%, 8%, 0.9)",
                    border: `1px solid ${obj.color}40`,
                    backdropFilter: "blur(20px)",
                    transform: `scale(${scale}) translateX(${slideX}px)`,
                    opacity,
                    boxShadow: `
                      0 0 ${25 * glowIntensity}px ${obj.color}20,
                      0 10px 40px -10px hsla(220, 30%, 0%, 0.5),
                      inset 0 1px 0 hsla(210, 40%, 98%, 0.05)
                    `,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 13,
                      background: `${obj.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: `0 0 15px ${obj.color}30`,
                    }}
                  >
                    <Icon size={26} color={obj.color} />
                  </div>
                  <span
                    style={{
                      fontSize: 22,
                      color: "hsl(210, 40%, 92%)",
                      fontWeight: 500,
                    }}
                  >
                    {obj.text}
                  </span>
                </div>
                {index < objectives.length - 1 && (
                  <div style={{ margin: "4px 0" }}>
                    <FlowingConnector
                      startDelay={delay + 15}
                      duration={20}
                      color={obj.color}
                      direction="vertical"
                      length={24}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SceneTransition durationInFrames={150} type="fade" direction="both" />
    </AbsoluteFill>
  );
};

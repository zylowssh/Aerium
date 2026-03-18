import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { AlertTriangle, MapPin, Clock, XCircle } from "lucide-react";
import { AnimatedBackground, SceneTransition } from "../components";

const problems = [
  { icon: MapPin, label: "Couverture locale", value: "Faible", color: "hsl(8, 86%, 64%)" },
  { icon: Clock, label: "Donnees en direct", value: "Limitees", color: "hsl(32, 92%, 64%)" },
  { icon: XCircle, label: "Lecture publique", value: "Complexe", color: "hsl(45, 90%, 62%)" },
];

export const ProblemScene: React.FC = () => {
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

  // Warning pulse effect
  const pulseOpacity = interpolate(frame % 45, [0, 22, 45], [0.3, 0.7, 0.3]);
  const pulseScale = interpolate(frame % 45, [0, 22, 45], [0.95, 1.05, 0.95]);

  return (
    <AbsoluteFill style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <AnimatedBackground variant="problem" particleCount={15} />

      {/* Warning glow effect */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: `translate(-50%, 0) scale(${pulseScale})`,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsla(0, 70%, 50%, 0.2) 0%, transparent 70%)",
          opacity: pulseOpacity,
          filter: "blur(60px)",
        }}
      />

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
        {/* Title with warning icon */}
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
              background: "hsla(0, 70%, 55%, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 30px hsla(0, 70%, 55%, 0.3)",
            }}
          >
            <AlertTriangle size={28} color="hsl(0, 70%, 60%)" />
          </div>
          <h2
            style={{
              fontSize: 52,
              fontWeight: 700,
              margin: 0,
              color: "hsl(10, 84%, 66%)",
            }}
          >
            Constat Terrain
          </h2>
        </div>

        {/* Problem cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 20,
            width: "100%",
            maxWidth: 1200,
          }}
        >
          {problems.map((problem, index) => {
            const delay = 40 + index * 20;
            const slideY = interpolate(frame - delay, [0, 25], [50, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            const itemOpacity = interpolate(frame - delay, [0, 20], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const Icon = problem.icon;

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "24px 24px",
                  borderRadius: 18,
                  background: "hsla(220, 20%, 8%, 0.9)",
                  border: `1px solid ${problem.color}40`,
                  backdropFilter: "blur(20px)",
                  transform: `translateY(${slideY}px)`,
                  opacity: itemOpacity,
                  minHeight: 230,
                  boxShadow: `
                    0 0 30px ${problem.color}15,
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
                    background: `${problem.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: `0 0 20px ${problem.color}30`,
                  }}
                >
                  <Icon size={26} color={problem.color} />
                </div>
                <span
                  style={{
                    fontSize: 18,
                    color: "hsl(210, 30%, 72%)",
                    fontWeight: 600,
                    lineHeight: 1.35,
                  }}
                >
                  {problem.label}
                </span>
                <span
                  style={{
                    fontSize: 36,
                    color: "hsl(210, 40%, 92%)",
                    fontWeight: 700,
                    letterSpacing: "0.01em",
                  }}
                >
                  {problem.value}
                </span>
                <div
                  style={{
                    width: "100%",
                    height: 6,
                    borderRadius: 999,
                    background: "hsla(210, 30%, 22%, 0.45)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${interpolate(frame - delay, [0, 30], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${problem.color}, hsla(190, 85%, 62%, 0.9))`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <SceneTransition durationInFrames={150} type="wipe" direction="both" color="hsl(10, 32%, 9%)" />
    </AbsoluteFill>
  );
};

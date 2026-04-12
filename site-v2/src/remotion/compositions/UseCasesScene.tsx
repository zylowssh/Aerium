import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { GraduationCap, Users, Building2 } from "lucide-react";
import { AnimatedBackground, SceneTransition } from "../components";

const useCases = [
  { icon: GraduationCap, title: "Élèves", text: "Comprendre les enjeux environnementaux" },
  { icon: Users, title: "Citoyens", text: "Connaître la qualité de l'air autour d'eux" },
  { icon: Building2, title: "Établissements", text: "Surveiller leur environnement" },
];

export const UseCasesScene: React.FC = () => {
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
            Utilisateurs
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
            Intérêt du Projet
          </h2>
          <p
            style={{
              fontSize: 18,
              fontWeight: 400,
              color: "rgba(250, 250, 250, 0.5)",
              margin: "8px 0 0 0",
              opacity: interpolate(titleSpring, [0.5, 1], [0, 1], { extrapolateLeft: "clamp" }),
            }}
          >
            Aerium peut être utilisé par :
          </p>
        </div>

        {/* Use case cards */}
        <div
          style={{
            display: "flex",
            gap: 24,
          }}
        >
          {useCases.map((useCase, index) => {
            const delay = 50 + index * 18;
            
            const cardSpring = spring({
              frame: frame - delay,
              fps,
              config: { damping: 16, stiffness: 100 },
            });

            const Icon = useCase.icon;

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
                  padding: "36px 28px",
                  width: 260,
                  borderRadius: 16,
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  opacity: cardSpring,
                  transform: `translateY(${interpolate(cardSpring, [0, 1], [35, 0])}px)`,
                  textAlign: "center",
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    backgroundColor: `${accentColor}12`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={32} color={accentColor} strokeWidth={1.5} />
                </div>

                {/* Title */}
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: "#fafafa",
                  }}
                >
                  {useCase.title}
                </span>

                {/* Description */}
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 400,
                    color: "rgba(250, 250, 250, 0.55)",
                    lineHeight: 1.5,
                  }}
                >
                  {useCase.text}
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

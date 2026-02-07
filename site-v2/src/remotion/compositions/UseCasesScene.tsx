import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { GraduationCap, Users, Building2, Heart } from "lucide-react";
import { AnimatedBackground, SceneTransition } from "../components";

const useCases = [
  { icon: GraduationCap, title: "Élèves", text: "Comprendre les enjeux environnementaux", color: "hsl(165, 70%, 55%)" },
  { icon: Users, title: "Citoyens", text: "Connaître la qualité de l'air autour d'eux", color: "hsl(190, 80%, 50%)" },
  { icon: Building2, title: "Établissements", text: "Surveiller leur environnement", color: "hsl(220, 60%, 55%)" },
];

export const UseCasesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [10, 30], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  });

  const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <AnimatedBackground variant="default" particleCount={18} />

      {/* Heart pulse in center */}
      {[0, 1, 2].map((i) => {
        const pulseDelay = i * 25;
        const pulseScale = interpolate((frame + pulseDelay) % 90, [0, 45, 90], [0.8, 1.2, 0.8]);
        const pulseOpacity = interpolate((frame + pulseDelay) % 90, [0, 45, 90], [0.2, 0.05, 0.2]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) scale(${pulseScale})`,
              width: 600 + i * 150,
              height: 600 + i * 150,
              borderRadius: "50%",
              border: `1px solid hsla(190, 80%, 50%, ${0.2 - i * 0.05})`,
              opacity: pulseOpacity,
            }}
          />
        );
      })}

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
            textAlign: "center",
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <Heart size={32} color="hsl(165, 70%, 55%)" />
            <h2 style={{ fontSize: 52, fontWeight: 700, margin: 0 }}>
              <span style={{ color: "hsl(210, 40%, 98%)" }}>Intérêt du </span>
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
          <p
            style={{
              fontSize: 24,
              color: "hsl(215, 20%, 60%)",
              margin: 0,
              marginTop: 16,
              opacity: subtitleOpacity,
            }}
          >
            Aerium peut être utilisé par :
          </p>
        </div>

        {/* Use case cards */}
        <div
          style={{
            display: "flex",
            gap: 28,
          }}
        >
          {useCases.map((useCase, index) => {
            const delay = 50 + index * 18;
            const scale = spring({
              frame: frame - delay,
              fps,
              config: { damping: 14, stiffness: 100 },
            });
            const opacity = interpolate(frame - delay, [0, 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const yOffset = interpolate(frame - delay, [0, 25], [40, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            const Icon = useCase.icon;
            const glowIntensity = interpolate((frame + index * 30) % 90, [0, 45, 90], [0.4, 0.75, 0.4]);

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 18,
                  padding: "36px 32px",
                  borderRadius: 24,
                  background: "hsla(220, 20%, 8%, 0.95)",
                  border: `1px solid ${useCase.color}45`,
                  backdropFilter: "blur(20px)",
                  transform: `scale(${scale}) translateY(${yOffset}px)`,
                  opacity,
                  width: 280,
                  textAlign: "center",
                  boxShadow: `
                    0 0 ${35 * glowIntensity}px ${useCase.color}25,
                    0 20px 60px -20px hsla(220, 30%, 0%, 0.6),
                    inset 0 1px 0 hsla(210, 40%, 98%, 0.08)
                  `,
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 20,
                    background: `${useCase.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 0 25px ${useCase.color}35`,
                  }}
                >
                  <Icon size={40} color={useCase.color} />
                </div>
                <h3
                  style={{
                    fontSize: 26,
                    fontWeight: 600,
                    color: useCase.color,
                    margin: 0,
                  }}
                >
                  {useCase.title}
                </h3>
                <span
                  style={{
                    fontSize: 16,
                    color: "hsl(215, 20%, 70%)",
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

import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface AnimatedBackgroundProps {
  variant?: "dark" | "accent" | "warm" | "cool";
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  variant = "dark",
}) => {
  const frame = useCurrentFrame();

  // Subtle animated gradient position
  const gradientAngle = interpolate(frame, [0, 600], [135, 145], {
    extrapolateRight: "clamp",
  });

  const backgrounds = {
    dark: {
      base: "#09090b",
      accent: "rgba(34, 211, 238, 0.03)",
      secondary: "rgba(139, 92, 246, 0.02)",
    },
    accent: {
      base: "#09090b",
      accent: "rgba(16, 185, 129, 0.05)",
      secondary: "rgba(34, 211, 238, 0.03)",
    },
    warm: {
      base: "#0c0a09",
      accent: "rgba(251, 146, 60, 0.04)",
      secondary: "rgba(239, 68, 68, 0.03)",
    },
    cool: {
      base: "#0c0d12",
      accent: "rgba(59, 130, 246, 0.04)",
      secondary: "rgba(139, 92, 246, 0.03)",
    },
  };

  const config = backgrounds[variant];

  return (
    <AbsoluteFill>
      {/* Solid base */}
      <AbsoluteFill style={{ backgroundColor: config.base }} />

      {/* Primary gradient orb */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 50% at 30% 40%, ${config.accent} 0%, transparent 70%)`,
          transform: `rotate(${gradientAngle - 135}deg)`,
        }}
      />

      {/* Secondary gradient orb */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 45% at 75% 65%, ${config.secondary} 0%, transparent 65%)`,
        }}
      />

      {/* Subtle noise texture */}
      <AbsoluteFill
        style={{
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Soft vignette */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

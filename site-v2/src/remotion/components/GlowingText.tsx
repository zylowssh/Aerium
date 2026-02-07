import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { CSSProperties } from "react";

interface GlowingTextProps {
  children: React.ReactNode;
  delay?: number;
  fontSize?: number;
  gradient?: string;
  style?: CSSProperties;
  glow?: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export const GlowingText: React.FC<GlowingTextProps> = ({
  children,
  delay = 0,
  fontSize = 48,
  gradient = "linear-gradient(135deg, hsl(165, 70%, 55%) 0%, hsl(190, 80%, 50%) 100%)",
  style,
  glow = true,
  as: Component = "span",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame - delay, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const y = interpolate(frame - delay, [0, 25], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const glowIntensity = glow ? interpolate(frame % 60, [0, 30, 60], [0.5, 1, 0.5]) : 0;

  return (
    <Component
      style={{
        fontSize,
        fontWeight: 700,
        margin: 0,
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
        background: gradient,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        textShadow: glow ? `0 0 ${40 * glowIntensity}px hsla(165, 70%, 55%, ${0.3 * glowIntensity})` : undefined,
        fontFamily: "'Space Grotesk', sans-serif",
        ...style,
      }}
    >
      {children}
    </Component>
  );
};

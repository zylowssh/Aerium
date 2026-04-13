import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { CSSProperties, ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface AnimatedCardProps {
  children?: ReactNode;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  color?: string;
  delay?: number;
  index?: number;
  style?: CSSProperties;
  variant?: "default" | "horizontal" | "compact";
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  icon: Icon,
  title,
  description,
  color = "hsl(165, 70%, 55%)",
  delay = 0,
  index = 0,
  style,
  variant = "default",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const opacity = interpolate(frame - delay, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const slideX = interpolate(frame - delay, [0, 20], [index % 2 === 0 ? -30 : 30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Hover-like glow effect based on frame
  const glowIntensity = interpolate((frame + index * 20) % 90, [0, 45, 90], [0.3, 0.6, 0.3]);

  const baseStyle: CSSProperties = {
    display: "flex",
    flexDirection: variant === "horizontal" ? "row" : "column",
    alignItems: variant === "horizontal" ? "center" : "center",
    gap: variant === "compact" ? 12 : 16,
    padding: variant === "compact" ? "20px 24px" : "28px 24px",
    borderRadius: 20,
    background: "hsla(220, 20%, 8%, 0.9)",
    border: `1px solid ${color}40`,
    backdropFilter: "blur(20px)",
    transform: `scale(${scale}) translateX(${slideX}px)`,
    opacity,
    textAlign: variant === "horizontal" ? "left" : "center",
    boxShadow: `
      0 0 ${30 * glowIntensity}px ${color}20,
      0 10px 40px -10px hsla(220, 30%, 0%, 0.5),
      inset 0 1px 0 hsla(210, 40%, 98%, 0.05)
    `,
    ...style,
  };

  return (
    <div style={baseStyle}>
      {Icon && (
        <div
          style={{
            width: variant === "compact" ? 48 : 64,
            height: variant === "compact" ? 48 : 64,
            borderRadius: variant === "compact" ? 12 : 16,
            background: `${color}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 0 ${20 * glowIntensity}px ${color}30`,
          }}
        >
          <Icon size={variant === "compact" ? 24 : 32} color={color} />
        </div>
      )}
      {title && (
        <span
          style={{
            fontSize: variant === "compact" ? 18 : 22,
            fontWeight: 600,
            color: "hsl(210, 40%, 98%)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {title}
        </span>
      )}
      {description && (
        <span
          style={{
            fontSize: variant === "compact" ? 14 : 16,
            color: "hsl(215, 20%, 65%)",
            lineHeight: 1.4,
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {description}
        </span>
      )}
      {children}
    </div>
  );
};

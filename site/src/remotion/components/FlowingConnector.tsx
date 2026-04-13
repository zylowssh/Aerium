import { useCurrentFrame, interpolate } from "remotion";

interface FlowingConnectorProps {
  startDelay?: number;
  duration?: number;
  color?: string;
  direction?: "horizontal" | "vertical";
  length?: number;
}

export const FlowingConnector: React.FC<FlowingConnectorProps> = ({
  startDelay = 0,
  duration = 30,
  color = "hsl(165, 70%, 55%)",
  direction = "horizontal",
  length = 60,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame - startDelay, [0, duration], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(frame - startDelay, [0, 10, duration - 5, duration], [0, 1, 1, 0.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Flowing particle effect
  const particlePos = (frame * 2) % length;

  const isHorizontal = direction === "horizontal";

  return (
    <div
      style={{
        position: "relative",
        width: isHorizontal ? length : 4,
        height: isHorizontal ? 4 : length,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Base line */}
      <div
        style={{
          position: "absolute",
          width: isHorizontal ? `${progress}%` : "100%",
          height: isHorizontal ? "100%" : `${progress}%`,
          background: `linear-gradient(${isHorizontal ? "90deg" : "180deg"}, ${color}60, ${color})`,
          borderRadius: 2,
          opacity,
        }}
      />
      
      {/* Flowing particle */}
      {progress > 50 && (
        <div
          style={{
            position: "absolute",
            left: isHorizontal ? particlePos : "50%",
            top: isHorizontal ? "50%" : particlePos,
            transform: "translate(-50%, -50%)",
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: color,
            boxShadow: `0 0 12px ${color}, 0 0 24px ${color}80`,
            opacity: 0.9,
          }}
        />
      )}

      {/* Arrow head */}
      <div
        style={{
          position: "absolute",
          right: isHorizontal ? 0 : undefined,
          bottom: !isHorizontal ? 0 : undefined,
          width: 0,
          height: 0,
          borderLeft: isHorizontal ? `8px solid ${color}` : "5px solid transparent",
          borderRight: isHorizontal ? "none" : "5px solid transparent",
          borderTop: !isHorizontal ? `8px solid ${color}` : "5px solid transparent",
          borderBottom: !isHorizontal ? "none" : "5px solid transparent",
          opacity: progress > 80 ? 1 : 0,
          transform: isHorizontal ? "translateX(4px)" : "translateY(4px)",
        }}
      />
    </div>
  );
};

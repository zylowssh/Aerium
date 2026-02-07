import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";

interface SceneTransitionProps {
  durationInFrames: number;
  type?: "fade" | "wipe" | "zoom" | "slide" | "blur";
  direction?: "in" | "out" | "both";
  color?: string;
}

export const SceneTransition: React.FC<SceneTransitionProps> = ({
  durationInFrames,
  type = "fade",
  direction = "both",
  color = "hsl(220, 30%, 5%)",
}) => {
  const frame = useCurrentFrame();
  
  const fadeInFrames = 20;
  const fadeOutFrames = 15;

  // For "both" direction, we handle entry and exit
  if (direction === "both") {
    // Entry fade (beginning of scene)
    const entryOpacity = interpolate(
      frame,
      [0, fadeInFrames],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    // Exit fade (end of scene)
    const exitOpacity = interpolate(
      frame,
      [durationInFrames - fadeOutFrames, durationInFrames],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    if (type === "fade") {
      return (
        <>
          {/* Entry overlay */}
          <AbsoluteFill
            style={{
              backgroundColor: color,
              opacity: entryOpacity,
              pointerEvents: "none",
            }}
          />
          {/* Exit overlay */}
          <AbsoluteFill
            style={{
              backgroundColor: color,
              opacity: exitOpacity,
              pointerEvents: "none",
            }}
          />
        </>
      );
    }

    if (type === "slide") {
      const entryX = interpolate(
        frame,
        [0, fadeInFrames],
        [-100, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
      );
      const exitX = interpolate(
        frame,
        [durationInFrames - fadeOutFrames, durationInFrames],
        [0, 100],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) }
      );

      return (
        <>
          <AbsoluteFill
            style={{
              backgroundColor: color,
              transform: `translateX(${entryX}%)`,
              pointerEvents: "none",
            }}
          />
          <AbsoluteFill
            style={{
              backgroundColor: color,
              transform: `translateX(${exitX - 100}%)`,
              pointerEvents: "none",
            }}
          />
        </>
      );
    }

    if (type === "blur") {
      const entryBlur = interpolate(
        frame,
        [0, fadeInFrames],
        [20, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      const exitBlur = interpolate(
        frame,
        [durationInFrames - fadeOutFrames, durationInFrames],
        [0, 20],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );

      return (
        <>
          <AbsoluteFill
            style={{
              backgroundColor: `${color}80`,
              opacity: entryOpacity,
              backdropFilter: `blur(${entryBlur}px)`,
              pointerEvents: "none",
            }}
          />
          <AbsoluteFill
            style={{
              backgroundColor: `${color}80`,
              opacity: exitOpacity,
              backdropFilter: `blur(${exitBlur}px)`,
              pointerEvents: "none",
            }}
          />
        </>
      );
    }
  }

  // Original single-direction logic
  const startFade = direction === "in" ? 0 : durationInFrames - fadeOutFrames;
  const endFade = direction === "in" ? fadeInFrames : durationInFrames;

  if (type === "fade") {
    const opacity = interpolate(
      frame,
      [startFade, endFade],
      direction === "in" ? [1, 0] : [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return (
      <AbsoluteFill
        style={{
          backgroundColor: color,
          opacity,
          pointerEvents: "none",
        }}
      />
    );
  }

  if (type === "wipe") {
    const progress = interpolate(
      frame,
      [startFade, endFade],
      direction === "in" ? [100, 0] : [0, 100],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return (
      <AbsoluteFill
        style={{
          background: `linear-gradient(90deg, ${color} ${progress}%, transparent ${progress + 20}%)`,
          pointerEvents: "none",
        }}
      />
    );
  }

  if (type === "zoom") {
    const scale = interpolate(
      frame,
      [startFade, endFade],
      direction === "in" ? [1.2, 1] : [1, 1.2],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    const opacity = interpolate(
      frame,
      [startFade, endFade],
      direction === "in" ? [1, 0] : [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return (
      <AbsoluteFill
        style={{
          backgroundColor: color,
          opacity,
          transform: `scale(${scale})`,
          pointerEvents: "none",
        }}
      />
    );
  }

  return null;
};

import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";

interface SceneTransitionProps {
  durationInFrames: number;
  type?: "fade" | "wipe" | "scale";
  direction?: "in" | "out" | "both";
}

export const SceneTransition: React.FC<SceneTransitionProps> = ({
  durationInFrames,
  type = "fade",
  direction = "both",
}) => {
  const frame = useCurrentFrame();
  const entryFrames = 18;
  const exitFrames = 15;

  // Clean fade transition with subtle blur
  const createFadeTransition = (phase: "in" | "out") => {
    const isEntry = phase === "in";
    const startFrame = isEntry ? 0 : durationInFrames - exitFrames;
    const endFrame = isEntry ? entryFrames : durationInFrames;

    const opacity = interpolate(
      frame,
      [startFrame, endFrame],
      isEntry ? [1, 0] : [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }
    );

    return (
      <AbsoluteFill
        key={phase}
        style={{
          backgroundColor: "#09090b",
          opacity,
          pointerEvents: "none",
        }}
      />
    );
  };

  // Horizontal wipe transition
  const createWipeTransition = (phase: "in" | "out") => {
    const isEntry = phase === "in";
    const startFrame = isEntry ? 0 : durationInFrames - exitFrames;
    const endFrame = isEntry ? entryFrames : durationInFrames;

    const progress = interpolate(
      frame,
      [startFrame, endFrame],
      isEntry ? [0, 100] : [0, 100],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }
    );

    const clipPath = isEntry 
      ? `inset(0 ${progress}% 0 0)`
      : `inset(0 0 0 ${progress}%)`;

    return (
      <AbsoluteFill
        key={phase}
        style={{
          backgroundColor: "#09090b",
          clipPath,
          pointerEvents: "none",
        }}
      />
    );
  };

  // Scale transition with fade
  const createScaleTransition = (phase: "in" | "out") => {
    const isEntry = phase === "in";
    const startFrame = isEntry ? 0 : durationInFrames - exitFrames;
    const endFrame = isEntry ? entryFrames : durationInFrames;

    const opacity = interpolate(
      frame,
      [startFrame, endFrame],
      isEntry ? [1, 0] : [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }
    );

    const scale = interpolate(
      frame,
      [startFrame, endFrame],
      isEntry ? [1.05, 1] : [1, 1.05],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }
    );

    return (
      <AbsoluteFill
        key={phase}
        style={{
          backgroundColor: "#09090b",
          opacity,
          transform: `scale(${scale})`,
          pointerEvents: "none",
        }}
      />
    );
  };

  const getTransition = (phase: "in" | "out") => {
    switch (type) {
      case "wipe":
        return createWipeTransition(phase);
      case "scale":
        return createScaleTransition(phase);
      default:
        return createFadeTransition(phase);
    }
  };

  if (direction === "both") {
    return (
      <>
        {getTransition("in")}
        {getTransition("out")}
      </>
    );
  }

  return getTransition(direction);
};

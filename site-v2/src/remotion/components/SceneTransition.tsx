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
  const entryFrames = 24;
  const exitFrames = 20;

  const cinematicPhase = (phase: "in" | "out", startFrame: number, endFrame: number) => {
    const rawProgress = interpolate(frame, [startFrame, endFrame], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: phase === "in" ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic),
    });

    const opacity = phase === "in"
      ? interpolate(rawProgress, [0, 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : interpolate(rawProgress, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    const lumaSweep = phase === "in"
      ? interpolate(rawProgress, [0, 1], [-40, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : interpolate(rawProgress, [0, 1], [-10, 130], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    const grainOpacity = interpolate(rawProgress, [0, 0.45, 1], [0.18, 0.32, 0.12], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    const leakOpacity = interpolate(rawProgress, [0, 0.4, 1], [0, 0.45, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    const blurStrength = phase === "in"
      ? interpolate(rawProgress, [0, 1], [9, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : interpolate(rawProgress, [0, 1], [0, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    return (
      <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
        <AbsoluteFill
          style={{
            backgroundColor: color,
            opacity: 0.96,
            filter: `blur(${blurStrength}px)`,
          }}
        />

        <AbsoluteFill
          style={{
            background: `linear-gradient(102deg, transparent ${lumaSweep - 18}%, rgba(210, 248, 255, 0.42) ${lumaSweep}%, transparent ${lumaSweep + 22}%)`,
            mixBlendMode: "screen",
            opacity: 0.8,
          }}
        />

        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at 16% 28%, rgba(16, 185, 129, 0.32), transparent 38%), radial-gradient(circle at 84% 78%, rgba(56, 189, 248, 0.28), transparent 42%)",
            mixBlendMode: "screen",
            opacity: leakOpacity,
          }}
        />

        <AbsoluteFill
          style={{
            opacity: grainOpacity,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </AbsoluteFill>
    );
  };

  // For "both" direction, we handle entry and exit
  if (direction === "both") {
    if (type === "fade") {
      return (
        <>
          {cinematicPhase("in", 0, entryFrames)}
          {cinematicPhase("out", durationInFrames - exitFrames, durationInFrames)}
        </>
      );
    }

    if (type === "slide") {
      const entryX = interpolate(
        frame,
        [0, entryFrames],
        [-100, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
      );
      const exitX = interpolate(
        frame,
        [durationInFrames - exitFrames, durationInFrames],
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
      const entryOpacity = interpolate(
        frame,
        [0, entryFrames],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      const exitOpacity = interpolate(
        frame,
        [durationInFrames - exitFrames, durationInFrames],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      const entryBlur = interpolate(
        frame,
        [0, entryFrames],
        [20, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      const exitBlur = interpolate(
        frame,
        [durationInFrames - exitFrames, durationInFrames],
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

    if (type === "wipe") {
      const entryProgress = interpolate(
        frame,
        [0, entryFrames],
        [100, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
      );
      const exitProgress = interpolate(
        frame,
        [durationInFrames - exitFrames, durationInFrames],
        [0, 100],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) }
      );

      return (
        <>
          <AbsoluteFill
            style={{
              background: `linear-gradient(90deg, ${color} ${entryProgress}%, transparent ${entryProgress + 20}%)`,
              pointerEvents: "none",
            }}
          />
          <AbsoluteFill
            style={{
              background: `linear-gradient(90deg, transparent ${exitProgress - 20}%, ${color} ${exitProgress}%)`,
              pointerEvents: "none",
            }}
          />
        </>
      );
    }

    if (type === "zoom") {
      const entryScale = interpolate(
        frame,
        [0, entryFrames],
        [1.15, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
      );
      const exitScale = interpolate(
        frame,
        [durationInFrames - exitFrames, durationInFrames],
        [1, 1.15],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) }
      );
      const entryOpacity = interpolate(
        frame,
        [0, entryFrames],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      const exitOpacity = interpolate(
        frame,
        [durationInFrames - exitFrames, durationInFrames],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );

      return (
        <>
          <AbsoluteFill
            style={{
              backgroundColor: color,
              opacity: entryOpacity,
              transform: `scale(${entryScale})`,
              pointerEvents: "none",
            }}
          />
          <AbsoluteFill
            style={{
              backgroundColor: color,
              opacity: exitOpacity,
              transform: `scale(${exitScale})`,
              pointerEvents: "none",
            }}
          />
        </>
      );
    }
  }

  // Original single-direction logic
  const startFade = direction === "in" ? 0 : durationInFrames - exitFrames;
  const endFade = direction === "in" ? entryFrames : durationInFrames;

  if (type === "fade") {
    return cinematicPhase(direction, startFade, endFade);
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

import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  delay: number;
  color: string;
}

interface AnimatedBackgroundProps {
  variant?: "intro" | "problem" | "solution" | "default";
  particleCount?: number;
}

const generateParticles = (count: number, colors: string[]): Particle[] => {
  return [...Array(count)].map((_, i) => ({
    x: (i * 37 + 17) % 100,
    y: (i * 53 + 23) % 100,
    size: 2 + (i % 5) * 1.5,
    speed: 0.5 + (i % 4) * 0.3,
    delay: i * 7,
    color: colors[i % colors.length],
  }));
};

const backgroundConfigs = {
  intro: {
    gradient: "linear-gradient(135deg, hsl(220, 30%, 4%) 0%, hsl(180, 25%, 6%) 50%, hsl(220, 25%, 8%) 100%)",
    colors: ["hsla(165, 70%, 55%, 0.5)", "hsla(190, 80%, 50%, 0.4)", "hsla(220, 60%, 55%, 0.3)"],
    glowColor: "hsla(165, 70%, 55%, 0.2)",
  },
  problem: {
    gradient: "linear-gradient(135deg, hsl(220, 30%, 4%) 0%, hsl(0, 15%, 6%) 50%, hsl(220, 25%, 8%) 100%)",
    colors: ["hsla(0, 70%, 55%, 0.4)", "hsla(35, 80%, 55%, 0.3)", "hsla(45, 90%, 55%, 0.3)"],
    glowColor: "hsla(0, 70%, 50%, 0.12)",
  },
  solution: {
    gradient: "linear-gradient(135deg, hsl(220, 30%, 4%) 0%, hsl(165, 20%, 6%) 50%, hsl(220, 25%, 8%) 100%)",
    colors: ["hsla(165, 70%, 55%, 0.6)", "hsla(190, 80%, 50%, 0.5)", "hsla(165, 60%, 45%, 0.4)"],
    glowColor: "hsla(165, 70%, 55%, 0.18)",
  },
  default: {
    gradient: "linear-gradient(135deg, hsl(220, 30%, 4%) 0%, hsl(220, 30%, 8%) 50%, hsl(200, 25%, 6%) 100%)",
    colors: ["hsla(165, 70%, 55%, 0.4)", "hsla(190, 80%, 50%, 0.35)", "hsla(220, 60%, 55%, 0.3)"],
    glowColor: "hsla(190, 80%, 50%, 0.1)",
  },
};

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  variant = "default",
  particleCount = 20,
}) => {
  const frame = useCurrentFrame();
  const config = backgroundConfigs[variant];
  const particles = generateParticles(particleCount, config.colors);

  // Multiple glow layers with different timing
  const glow1Opacity = interpolate(frame % 120, [0, 60, 120], [0.3, 0.7, 0.3]);
  const glow2Opacity = interpolate((frame + 40) % 90, [0, 45, 90], [0.2, 0.5, 0.2]);
  const glow1Scale = interpolate(frame % 180, [0, 90, 180], [1, 1.15, 1]);

  return (
    <AbsoluteFill style={{ background: config.gradient }}>
      {/* Grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(hsla(220, 40%, 30%, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, hsla(220, 40%, 30%, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          opacity: 0.5,
        }}
      />

      {/* Primary glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${glow1Scale})`,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 60%)`,
          opacity: glow1Opacity,
          filter: "blur(100px)",
        }}
      />

      {/* Secondary glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          right: "20%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
          opacity: glow2Opacity,
          filter: "blur(80px)",
        }}
      />

      {/* Floating particles */}
      {particles.map((p, i) => {
        const floatY = interpolate(
          (frame * p.speed + p.delay) % 200,
          [0, 200],
          [110, -10],
          { extrapolateRight: "clamp" }
        );
        const floatX = Math.sin((frame + p.delay) * 0.02) * 10;
        const particleOpacity = interpolate(
          floatY,
          [-10, 20, 80, 110],
          [0, 1, 1, 0]
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x + floatX * 0.1}%`,
              top: `${floatY}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: p.color,
              opacity: particleOpacity,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
          />
        );
      })}

      {/* Noise texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </AbsoluteFill>
  );
};

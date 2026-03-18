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
    gradient: "linear-gradient(132deg, hsl(214, 37%, 8%) 0%, hsl(195, 38%, 9%) 38%, hsl(214, 32%, 10%) 72%, hsl(222, 36%, 11%) 100%)",
    colors: ["hsla(160, 78%, 58%, 0.52)", "hsla(188, 86%, 62%, 0.42)", "hsla(204, 84%, 66%, 0.35)"],
    glowColor: "hsla(160, 78%, 58%, 0.24)",
  },
  problem: {
    gradient: "linear-gradient(132deg, hsl(220, 32%, 8%) 0%, hsl(8, 28%, 10%) 42%, hsl(220, 24%, 11%) 100%)",
    colors: ["hsla(10, 86%, 66%, 0.44)", "hsla(32, 92%, 64%, 0.34)", "hsla(46, 92%, 62%, 0.28)"],
    glowColor: "hsla(12, 88%, 62%, 0.16)",
  },
  solution: {
    gradient: "linear-gradient(132deg, hsl(214, 35%, 8%) 0%, hsl(165, 32%, 10%) 48%, hsl(208, 30%, 10%) 100%)",
    colors: ["hsla(158, 76%, 58%, 0.6)", "hsla(190, 86%, 60%, 0.48)", "hsla(175, 70%, 52%, 0.4)"],
    glowColor: "hsla(162, 78%, 58%, 0.22)",
  },
  default: {
    gradient: "linear-gradient(132deg, hsl(216, 34%, 8%) 0%, hsl(212, 33%, 10%) 45%, hsl(196, 36%, 10%) 100%)",
    colors: ["hsla(166, 76%, 56%, 0.42)", "hsla(192, 84%, 60%, 0.36)", "hsla(206, 76%, 64%, 0.3)"],
    glowColor: "hsla(192, 84%, 60%, 0.14)",
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
  const glow1Opacity = interpolate(frame % 120, [0, 60, 120], [0.25, 0.62, 0.25]);
  const glow2Opacity = interpolate((frame + 40) % 90, [0, 45, 90], [0.18, 0.42, 0.18]);
  const glow1Scale = interpolate(frame % 180, [0, 90, 180], [1, 1.12, 1]);
  const meshShift = interpolate(frame % 240, [0, 240], [0, 24]);

  return (
    <AbsoluteFill style={{ background: config.gradient }}>
      {/* Mesh grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(hsla(188, 55%, 70%, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, hsla(188, 55%, 70%, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          backgroundPosition: `${meshShift}px ${meshShift * 0.65}px`,
          opacity: 0.33,
        }}
      />

      {/* Atmospheric gradients inspired by landing cards */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 14% 18%, rgba(16,185,129,0.24), transparent 40%), radial-gradient(circle at 86% 76%, rgba(34,211,238,0.2), transparent 42%)",
          opacity: 0.75,
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
          filter: "blur(110px)",
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
          filter: "blur(90px)",
        }}
      />

      {/* Bottom cinematic vignette for better text readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(2, 8, 23, 0.52) 0%, rgba(2, 8, 23, 0.18) 35%, transparent 62%)",
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
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </AbsoluteFill>
  );
};

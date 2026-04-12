import { useCurrentFrame, interpolate } from "remotion";

interface WaveformVisualizationProps {
  barCount?: number;
  width?: number;
  height?: number;
  color?: string;
  style?: React.CSSProperties;
}

export const WaveformVisualization: React.FC<WaveformVisualizationProps> = ({
  barCount = 40,
  width = 400,
  height = 80,
  color = "hsl(165, 70%, 55%)",
  style,
}) => {
  const frame = useCurrentFrame();
  
  const bars = [...Array(barCount)].map((_, i) => {
    const phase = (i / barCount) * Math.PI * 4;
    const wave1 = Math.sin(frame * 0.1 + phase) * 0.3;
    const wave2 = Math.sin(frame * 0.15 + phase * 1.5) * 0.2;
    const wave3 = Math.sin(frame * 0.05 + phase * 0.5) * 0.15;
    const heightPercent = 0.3 + Math.abs(wave1 + wave2 + wave3);
    
    return {
      height: heightPercent,
      opacity: 0.5 + heightPercent * 0.5,
    };
  });

  const barWidth = width / barCount * 0.7;
  const gap = width / barCount * 0.3;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: gap,
        width,
        height,
        ...style,
      }}
    >
      {bars.map((bar, i) => (
        <div
          key={i}
          style={{
            width: barWidth,
            height: `${bar.height * 100}%`,
            backgroundColor: color,
            opacity: bar.opacity,
            borderRadius: barWidth / 2,
            transition: "height 0.05s ease-out",
          }}
        />
      ))}
    </div>
  );
};

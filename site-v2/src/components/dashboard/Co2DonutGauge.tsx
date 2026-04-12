import { motion } from "framer-motion";
import { getAirQualityLevel, getAirQualityColor } from "@/lib/sensorData";
import { cn } from "@/lib/utils";

interface Co2DonutGaugeProps {
  co2: number;
  /** px */
  size?: number;
}

export function Co2DonutGauge({ co2, size = 200 }: Co2DonutGaugeProps) {
  const level = getAirQualityLevel(co2);
  const textColor = getAirQualityColor(level); // e.g. text-success

  // 0..2000 ppm → 0..1
  const progress = Math.max(0, Math.min(1, co2 / 2000));

  const stroke = 10;
  const r = 44;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - progress);

  const getMessage = () => {
    switch (level) {
      case "excellente":
        return "Excellente qualité de l'air";
      case "bonne":
        return "Bonne qualité de l'air";
      case "modérée":
        return "Envisager d'améliorer la ventilation";
      case "médiocre":
        return "Ouverture des fenêtres recommandée";
      case "dangereuse":
        return "Action immédiate requise";
      default:
        return "";
    }
  };

  const ringColorClass =
    level === "excellente"
      ? "text-success"
      : level === "bonne"
        ? "text-primary"
        : level === "modérée"
          ? "text-warning"
          : "text-destructive";

  return (
    <div className="w-full">
      <div
        className="relative mx-auto"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full"
          aria-label={`CO₂ gauge: ${co2} ppm`}
          role="img"
        >
          {/* Track */}
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={`hsl(var(--border))`}
            strokeWidth={stroke}
          />

          {/* Progress */}
          <motion.circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className={cn(ringColorClass)}
            transform="rotate(-90 50 50)"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 grid place-items-center text-center">
          <div className="space-y-1">
            <div className="text-4xl font-bold text-foreground leading-none tabular-nums">
              {co2}
            </div>
            <div className="text-xs font-medium text-muted-foreground tracking-wide">
              PPM CO₂
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", textColor.replace("text-", "bg-"))} />
          <span className={cn("text-sm font-semibold capitalize", textColor)}>{level}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{getMessage()}</p>
      </div>
    </div>
  );
}

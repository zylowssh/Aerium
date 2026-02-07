import { motion } from 'framer-motion';
import { getAirQualityLevel, getAirQualityColor } from '@/lib/sensorData';
import { cn } from '@/lib/utils';

interface AirQualityGaugeProps {
  co2: number;
  size?: number;
}

export function AirQualityGauge({ co2, size = 200 }: AirQualityGaugeProps) {
  const level = getAirQualityLevel(co2);
  const colorClass = getAirQualityColor(level);
  
  // Calculate percentage (0-2000 ppm range)
  const percentage = Math.min(100, (co2 / 2000) * 100);
  
  // Calculate stroke dash offset for the arc
  const radius = (size - 20) / 2;
  const circumference = radius * Math.PI * 1.5; // 270 degrees arc
  const offset = circumference - (percentage / 100) * circumference;
  
  const getArcColor = () => {
    if (co2 < 600) return 'stroke-success';
    if (co2 < 800) return 'stroke-primary';
    if (co2 < 1000) return 'stroke-warning';
    return 'stroke-destructive';
  };

  const getMessage = () => {
    switch (level) {
      case 'excellente': return "Excellente qualité de l'air";
      case 'bonne': return "Bonne qualité de l'air";
      case 'modérée': return "Envisager d'améliorer la ventilation";
      case 'médiocre': return "Ouverture des fenêtres recommandée";
      case 'dangereuse': return "Action immédiate requise";
      default: return '';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size * 0.75 }}>
        <svg 
          width={size} 
          height={size * 0.75} 
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {/* Background arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth="12"
            className="stroke-muted"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
            transform={`rotate(135, ${size / 2}, ${size / 2})`}
          />
          
          {/* Value arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth="12"
            className={cn(getArcColor(), "drop-shadow-lg")}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset + circumference * 0.25 }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeLinecap="round"
            transform={`rotate(135, ${size / 2}, ${size / 2})`}
          />
        </svg>
        
        {/* Center content */}
        <div 
          className="absolute flex flex-col items-center justify-center"
          style={{ 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)'
          }}
        >
          <motion.span 
            className="text-4xl font-bold text-foreground leading-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {co2}
          </motion.span>
          <span className="text-sm text-muted-foreground font-medium mt-1">PPM</span>
        </div>
      </div>
      
      <div className="text-center mt-3">
        <div className="flex items-center justify-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", colorClass.replace('text-', 'bg-'))} />
          <span className={cn("font-semibold capitalize text-sm", colorClass)}>{level}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{getMessage()}</p>
      </div>
    </div>
  );
}

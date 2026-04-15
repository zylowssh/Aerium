import { useEffect, useId, useMemo, useRef } from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { Reading } from '@/lib/sensorData';
import { format } from 'date-fns';

interface TrendChartProps {
  data: Reading[];
  height?: number;
  title?: string | null;
}

export function TrendChart({ data, height = 250, title = 'Tendance sur 24 Heures' }: TrendChartProps) {
  const gradientId = useId();
  const hasAnimatedRef = useRef(false);

  const shouldAnimate = data.length > 1 && !hasAnimatedRef.current;

  useEffect(() => {
    if (data.length > 1 && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
    }
  }, [data.length]);

  const chartData = useMemo(() => {
    return data.map(reading => ({
      time: format(reading.timestamp, 'HH:mm'),
      co2: reading.co2,
      fullTime: format(reading.timestamp, 'HH:mm')
    }));
  }, [data]);

  const yDomain = useMemo<[number, number]>(() => {
    if (!data.length) {
      return [400, 1200];
    }

    const minValue = Math.min(...data.map(d => d.co2));
    const maxValue = Math.max(...data.map(d => d.co2));

    const lowerBound = Math.max(350, Math.floor((minValue - 80) / 50) * 50);
    const upperBound = Math.max(900, Math.ceil((maxValue + 120) / 50) * 50);

    return [lowerBound, upperBound];
  }, [data]);

  const maxCo2 = data.length > 0 ? Math.max(...data.map(d => d.co2)) : null;
  const peakData = maxCo2 !== null ? data.find(d => d.co2 === maxCo2) : null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
          <p className="text-sm text-muted-foreground">{payload[0]?.payload?.fullTime}</p>
          <p className="text-lg font-semibold text-primary">
            {payload[0]?.value} <span className="text-sm text-muted-foreground">ppm</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {title !== null && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-muted-foreground">{title}</h3>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.32} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            vertical={false}
          />
          
          <XAxis 
            dataKey="time" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickMargin={8}
            interval="preserveStartEnd"
          />
          
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickMargin={8}
            width={42}
            domain={yDomain}
          />
          
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'hsl(var(--primary))', strokeOpacity: 0.18 }}
          />
          
          {/* Warning threshold line */}
          <ReferenceLine 
            y={1000} 
            stroke="hsl(var(--warning))" 
            strokeDasharray="5 5"
            opacity={0.5}
          />
          
          {/* Critical threshold line */}
          <ReferenceLine 
            y={1200} 
            stroke="hsl(var(--destructive))" 
            strokeDasharray="5 5"
            opacity={0.5}
          />
          
          <Area
            type="monotone"
            dataKey="co2"
            stroke="none"
            fill={`url(#${gradientId})`}
            isAnimationActive={shouldAnimate}
            animationDuration={900}
            animationBegin={80}
            animationEasing="ease-out"
          />
          
          <Line
            type="monotone"
            dataKey="co2"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            strokeLinecap="round"
            dot={false}
            isAnimationActive={shouldAnimate}
            animationDuration={1200}
            animationBegin={120}
            animationEasing="ease-in-out"
            activeDot={{ 
              r: 6, 
              fill: 'hsl(var(--primary))',
              stroke: 'hsl(var(--background))',
              strokeWidth: 2
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {peakData && maxCo2 !== null && (
        <div className="flex items-center gap-2 mt-3 text-sm">
          <span className="w-2 h-2 rounded-full bg-warning" />
          <span className="text-muted-foreground">
            Pic: <span className="font-medium text-foreground">{maxCo2} ppm</span>
            {' '}à {format(peakData.timestamp, 'HH:mm')}
          </span>
        </div>
      )}
    </div>
  );
}

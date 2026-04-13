import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { Reading } from '@/lib/sensorData';
import { format } from 'date-fns';

interface TrendChartProps {
  data: Reading[];
  height?: number;
  title?: string | null;
}

export function TrendChart({ data, height = 250, title = 'Tendance sur 24 Heures' }: TrendChartProps) {
  const chartData = useMemo(() => {
    return data.map(reading => ({
      time: format(reading.timestamp, 'h a'),
      co2: reading.co2,
      fullTime: format(reading.timestamp, 'h:mm a')
    }));
  }, [data]);

  const maxCo2 = Math.max(...data.map(d => d.co2));
  const peakData = data.find(d => d.co2 === maxCo2);

  const CustomTooltip = ({ active, payload, label }: any) => {
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
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
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
            interval="preserveStartEnd"
          />
          
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            domain={[400, 'auto']}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
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
            fill="url(#co2Gradient)"
          />
          
          <Line
            type="monotone"
            dataKey="co2"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ 
              r: 6, 
              fill: 'hsl(var(--primary))',
              stroke: 'hsl(var(--background))',
              strokeWidth: 2
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {peakData && (
        <div className="flex items-center gap-2 mt-3 text-sm">
          <span className="w-2 h-2 rounded-full bg-warning" />
          <span className="text-muted-foreground">
            Pic: <span className="font-medium text-foreground">{maxCo2} ppm</span>
            {' '}at {format(peakData.timestamp, 'h:mm a')}
          </span>
        </div>
      )}
    </div>
  );
}

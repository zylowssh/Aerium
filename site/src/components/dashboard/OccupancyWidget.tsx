import { motion } from 'framer-motion';
import { Users, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Skeleton } from '@/components/ui/skeleton';

interface ZoneOccupancy {
  zone: string;
  current: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
}

interface OccupancySensorSnapshot {
  location?: string;
  status?: string;
}

export function OccupancyWidget() {
  const [zones, setZones] = useState<ZoneOccupancy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOccupancyData();
  }, []);

  const fetchOccupancyData = async () => {
    try {
      setLoading(true);
      const sensors = await apiClient.getSensors();
      
      // Derive zone activity from real sensor statuses by location.
      const zoneMap: Record<string, ZoneOccupancy> = {};
      
      (sensors as OccupancySensorSnapshot[]).forEach((sensor) => {
        const location = sensor.location || 'Défaut';
        if (!zoneMap[location]) {
          zoneMap[location] = {
            zone: location,
            current: 0,
            max: 0,
            trend: 'stable'
          };
        }

        zoneMap[location].max += 1;
        if (sensor.status === 'en ligne') {
          zoneMap[location].current += 1;
        }
      });
      
      const zonesArray = Object.values(zoneMap).map((zone) => {
        const ratio = zone.max > 0 ? zone.current / zone.max : 0;
        return {
          ...zone,
          trend: ratio >= 0.8 ? 'up' : ratio <= 0.3 ? 'down' : 'stable'
        };
      });

      setZones(zonesArray.length > 0 ? zonesArray : getDefaultZones());
    } catch (error) {
      console.error('Error fetching occupancy data:', error);
      setZones(getDefaultZones());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultZones = (): ZoneOccupancy[] => [
    { zone: 'Aucune zone', current: 0, max: 0, trend: 'stable' },
  ];

  const totalOccupancy = zones.reduce((acc, z) => acc + z.current, 0);
  const totalCapacity = zones.reduce((acc, z) => acc + z.max, 0);
  const overallPercent = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/80 p-4 md:p-5',
        'bg-card/70 backdrop-blur-sm supports-[backdrop-filter]:bg-card/55'
      )}
    >
      <div className="pointer-events-none absolute -left-20 -top-20 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            Activité
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Occupation</h3>
          </div>
        </div>
        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {totalOccupancy}/{totalCapacity}
        </span>
      </div>

      {/* Overall bar */}
      <div className="relative mb-4 rounded-lg border border-border/70 bg-background/55 p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Capteurs actifs</span>
          <span className={cn(
            'text-xs font-medium',
            overallPercent > 80 ? 'text-amber-500' : 'text-primary'
          )}>
            {overallPercent}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallPercent}%` }}
            transition={{ duration: 0.8 }}
            className={cn(
              'h-full rounded-full',
              overallPercent > 80 ? 'bg-amber-500' : 'bg-primary'
            )}
          />
        </div>
      </div>

      {/* Zone breakdown */}
      <div className="relative space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-border/70 bg-background/55 p-2.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-7" />
              </div>
            </div>
          ))
        ) : zones.length === 0 || zones[0].max === 0 ? (
          <div className="rounded-lg border border-dashed border-border/70 bg-background/45 p-3 text-xs text-muted-foreground">
            Aucune donnée d'occupation
          </div>
        ) : (
          zones.map((zone, index) => {
            const percent = zone.max > 0 ? Math.round((zone.current / zone.max) * 100) : 0;
            return (
              <motion.div
                key={zone.zone}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/55 p-2.5"
              >
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-foreground flex-1 truncate">{zone.zone}</span>
                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      'h-full rounded-full transition-all',
                      percent > 80 ? 'bg-amber-500' : 'bg-primary/70'
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {zone.current}
                </span>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Mise à jour en temps réel</span>
      </div>
    </motion.div>
  );
}

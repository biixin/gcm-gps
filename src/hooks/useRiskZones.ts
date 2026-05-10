import { useEffect, useState } from 'react';
import { realtimeService } from '../services/realtimeService';
import type { RiskZone } from '../types';

export function useRiskZones() {
  const [zones, setZones] = useState<RiskZone[]>([]);

  useEffect(() => realtimeService.subscribeZones(setZones), []);

  return {
    zones,
    saveZone: (zone: RiskZone) => realtimeService.upsertZone(zone),
    deleteZone: (id: string) => realtimeService.deleteZone(id),
  };
}

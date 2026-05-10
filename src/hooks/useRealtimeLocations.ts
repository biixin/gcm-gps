import { useEffect, useMemo, useState } from 'react';
import { realtimeService } from '../services/realtimeService';
import type { DeviceLocation } from '../types';

export function useRealtimeLocations(search = '', category = 'todos') {
  const [locations, setLocations] = useState<DeviceLocation[]>([]);

  useEffect(() => realtimeService.subscribeLocations(setLocations), []);

  const filteredLocations = useMemo(() => {
    const term = search.trim().toLowerCase();
    return locations.filter((location) => {
      const matchesSearch = !term || location.name.toLowerCase().includes(term) || location.category.toLowerCase().includes(term);
      const matchesCategory = category === 'todos' || location.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, locations, search]);

  return { locations, filteredLocations };
}

import { useEffect, useState } from 'react';
import { realtimeService } from '../services/realtimeService';
import type { SystemEvent, SystemLog } from '../types';

export function useSystemFeed() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  useEffect(() => realtimeService.subscribeEvents(setEvents), []);
  useEffect(() => realtimeService.subscribeLogs(setLogs), []);

  return { events, logs };
}

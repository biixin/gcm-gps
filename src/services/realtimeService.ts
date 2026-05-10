import type { DeviceLocation, RiskZone, SystemEvent, SystemLog } from '../types';
import { jitterCoordinate } from '../utils/geo';
import { mockEvents, mockLocations, mockLogs, mockZones } from '../utils/mockData';

type Listener<T> = (payload: T) => void;

class MockRealtimeService {
  private locations = [...mockLocations];
  private zones = [...mockZones];
  private events = [...mockEvents];
  private logs = [...mockLogs];
  private locationListeners = new Set<Listener<DeviceLocation[]>>();
  private zoneListeners = new Set<Listener<RiskZone[]>>();
  private eventListeners = new Set<Listener<SystemEvent[]>>();
  private logListeners = new Set<Listener<SystemLog[]>>();
  private timer?: number;

  connect() {
    if (this.timer) return;
    this.timer = window.setInterval(() => {
      this.locations = this.locations.map((location) => {
        if (location.status === 'offline') return location;
        return {
          ...location,
          lat: jitterCoordinate(location.lat),
          lng: jitterCoordinate(location.lng),
          speed: Math.max(0, Math.round(location.speed + (Math.random() - 0.45) * 8)),
          heading: Math.round((location.heading + Math.random() * 24) % 360),
          updatedAt: new Date().toISOString(),
        };
      });
      this.emitLocations();
    }, 2200);
  }

  subscribeLocations(listener: Listener<DeviceLocation[]>) {
    this.connect();
    this.locationListeners.add(listener);
    listener(this.locations);
    return () => {
      this.locationListeners.delete(listener);
    };
  }

  subscribeZones(listener: Listener<RiskZone[]>) {
    this.zoneListeners.add(listener);
    listener(this.zones);
    return () => {
      this.zoneListeners.delete(listener);
    };
  }

  subscribeEvents(listener: Listener<SystemEvent[]>) {
    this.eventListeners.add(listener);
    listener(this.events);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  subscribeLogs(listener: Listener<SystemLog[]>) {
    this.logListeners.add(listener);
    listener(this.logs);
    return () => {
      this.logListeners.delete(listener);
    };
  }

  addLocation(location: DeviceLocation) {
    this.locations = [location, ...this.locations];
    this.emitLocations();
    this.addLog('locations', `Localizacao ${location.name} adicionada.`);
  }

  removeLocation(id: string) {
    this.locations = this.locations.filter((item) => item.id !== id);
    this.emitLocations();
    this.addLog('locations', `Localizacao ${id} removida.`);
  }

  toggleTracking(userId: string) {
    this.locations = this.locations.map((location) =>
      location.userId === userId
        ? { ...location, status: location.status === 'offline' ? 'online' : 'offline', speed: 0 }
        : location,
    );
    this.emitLocations();
    this.addLog('tracking', `Rastreamento alternado para ${userId}.`);
  }

  upsertZone(zone: RiskZone) {
    const exists = this.zones.some((item) => item.id === zone.id);
    this.zones = exists ? this.zones.map((item) => (item.id === zone.id ? zone : item)) : [zone, ...this.zones];
    this.emitZones();
    this.addEvent({
      id: crypto.randomUUID(),
      type: 'risk',
      title: exists ? 'Zona atualizada' : 'Zona criada',
      description: zone.name,
      severity: zone.level,
      createdAt: new Date().toISOString(),
    });
  }

  deleteZone(id: string) {
    this.zones = this.zones.filter((item) => item.id !== id);
    this.emitZones();
    this.addLog('zones', `Zona ${id} removida.`);
  }

  private addEvent(event: SystemEvent) {
    this.events = [event, ...this.events].slice(0, 25);
    this.eventListeners.forEach((listener) => listener(this.events));
  }

  private addLog(scope: string, message: string) {
    this.logs = [{ id: crypto.randomUUID(), scope, message, createdAt: new Date().toISOString() }, ...this.logs].slice(0, 40);
    this.logListeners.forEach((listener) => listener(this.logs));
  }

  private emitLocations() {
    this.locationListeners.forEach((listener) => listener(this.locations));
  }

  private emitZones() {
    this.zoneListeners.forEach((listener) => listener(this.zones));
  }
}

export const realtimeService = new MockRealtimeService();

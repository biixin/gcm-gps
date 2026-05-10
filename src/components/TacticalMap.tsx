import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import { Circle, Crosshair, Hexagon, LocateFixed, MousePointer2, Pentagon, Satellite, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { DeviceLocation, RiskLevel, RiskZone } from '../types';
import { DEFAULT_CENTER } from '../utils/geo';
import { riskConfig, statusLabel } from '../utils/risk';

interface TacticalMapProps {
  locations: DeviceLocation[];
  zones: RiskZone[];
  satellite: boolean;
  heatmap: boolean;
  onCreateZone: (zone: RiskZone) => void;
}

type DrawMode = 'none' | 'circle' | 'polygon';
type GoogleMapsApi = any;
type GoogleMap = any;
type GoogleMarker = any;
type GoogleCircle = any;
type GooglePolygon = any;
type GooglePolyline = any;
type GoogleInfoWindow = any;
type GoogleLatLng = { lat: number; lng: number };

const googleMapsScriptId = 'google-maps-js-api';

declare global {
  interface Window {
    google: { maps: GoogleMapsApi };
    initGoogleMaps?: () => void;
  }
}

export function TacticalMap({ locations, zones, satellite, heatmap, onCreateZone }: TacticalMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const googleRef = useRef<GoogleMapsApi | null>(null);
  const markersRef = useRef<Record<string, GoogleMarker>>({});
  const zonesRef = useRef<Record<string, GoogleCircle | GooglePolygon>>({});
  const heatRef = useRef<GoogleCircle[]>([]);
  const draftPolylineRef = useRef<GooglePolyline | null>(null);
  const infoWindowRef = useRef<GoogleInfoWindow | null>(null);
  const gpsWatchRef = useRef<number | null>(null);
  const drawModeRef = useRef<DrawMode>('none');
  const polygonRef = useRef<[number, number][]>([]);
  const [drawMode, setDrawMode] = useState<DrawMode>('none');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('medio');
  const [zoneName, setZoneName] = useState('Zona personalizada');
  const [mapReady, setMapReady] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('Aguardando GPS');
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  useEffect(() => {
    drawModeRef.current = drawMode;
  }, [drawMode]);

  useEffect(() => {
    if (!containerRef.current || !googleMapsKey) return;
    let mounted = true;

    loadGoogleMaps(googleMapsKey)
      .then((maps) => {
        if (!mounted || !containerRef.current) return;
        googleRef.current = maps;
        infoWindowRef.current = new maps.InfoWindow();

        const map = new maps.Map(containerRef.current, {
          center: toGoogleLatLng(DEFAULT_CENTER),
          zoom: 14,
          mapTypeId: satellite ? maps.MapTypeId.SATELLITE : maps.MapTypeId.ROADMAP,
          tilt: 0,
          heading: 0,
          disableDefaultUI: false,
          fullscreenControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          clickableIcons: false,
          gestureHandling: 'greedy',
          styles: satellite ? undefined : googleRoadStyle,
        });

        mapRef.current = map;
        setMapReady(true);
        syncMarkers(maps, map, locations, markersRef.current, infoWindowRef.current);
        syncZones(maps, map, zones, zonesRef.current);
        syncHeatOverlay(maps, map, locations, heatmap, heatRef.current);
        startGpsWatch(maps, map);

        map.addListener('click', (event: any) => {
          if (!event.latLng) return;
          const mode = drawModeRef.current;
          if (mode === 'none') return;
          const point: [number, number] = [event.latLng.lng(), event.latLng.lat()];

          if (mode === 'circle') {
            onCreateZone(
              createZone({
                name: zoneName,
                level: riskLevel,
                shape: 'circle',
                center: point,
                radiusMeters: 520,
              }),
            );
            setDrawMode('none');
          }

          if (mode === 'polygon') {
            polygonRef.current = [...polygonRef.current, point];
            syncDraftPolygon(maps, map, polygonRef.current, draftPolylineRef);
          }
        });
      })
      .catch(() => setGpsStatus('Erro ao carregar Google Maps'));

    return () => {
      mounted = false;
      if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current);
      Object.values(markersRef.current).forEach((marker) => marker.setMap(null));
      Object.values(zonesRef.current).forEach((zone) => zone.setMap(null));
      heatRef.current.forEach((circle) => circle.setMap(null));
      mapRef.current?.__gpsMarker?.setMap(null);
      mapRef.current?.__gpsAccuracy?.setMap(null);
      draftPolylineRef.current?.setMap(null);
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const maps = googleRef.current;
    if (!map || !maps || !mapReady) return;
    map.setMapTypeId(satellite ? maps.MapTypeId.SATELLITE : maps.MapTypeId.ROADMAP);
    map.setOptions({ tilt: 0, heading: 0, styles: satellite ? undefined : googleRoadStyle });
  }, [satellite, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = googleRef.current;
    if (!map || !maps || !mapReady) return;
    syncMarkers(maps, map, locations, markersRef.current, infoWindowRef.current);
    syncHeatOverlay(maps, map, locations, heatmap, heatRef.current);
  }, [locations, heatmap, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = googleRef.current;
    if (!map || !maps || !mapReady) return;
    syncZones(maps, map, zones, zonesRef.current);
  }, [zones, mapReady]);

  function startGpsWatch(maps: GoogleMapsApi, map: GoogleMap) {
    if (!navigator.geolocation) {
      setGpsStatus('GPS indisponivel');
      return;
    }

    setGpsStatus('Solicitando GPS');
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const current = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setGpsStatus('GPS em tempo real');
        syncGpsPosition(maps, map, current, position.coords.accuracy);
      },
      () => setGpsStatus('Permissao de GPS negada'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 },
    );
  }

  function centerOnGps() {
    const map = mapRef.current;
    const marker = map?.__gpsMarker;
    const position = marker?.getPosition();
    if (!map || !position) return;
    map.panTo(position);
    map.setZoom(Math.max(map.getZoom() ?? 14, 16));
  }

  function finishPolygon() {
    if (polygonRef.current.length < 3) return;
    const coordinates = [...polygonRef.current, polygonRef.current[0]];
    onCreateZone(
      createZone({
        name: zoneName,
        level: riskLevel,
        shape: 'polygon',
        coordinates,
      }),
    );
    polygonRef.current = [];
    if (googleRef.current && mapRef.current) syncDraftPolygon(googleRef.current, mapRef.current, [], draftPolylineRef);
    setDrawMode('none');
  }

  function clearDrawing() {
    polygonRef.current = [];
    if (googleRef.current && mapRef.current) syncDraftPolygon(googleRef.current, mapRef.current, [], draftPolylineRef);
    setDrawMode('none');
  }

  return (
    <main className="absolute inset-0 overflow-hidden bg-slate-950">
      <div ref={containerRef} className={clsx('h-full w-full', !googleMapsKey && 'hidden')} />

      {!googleMapsKey && (
        <div className="tactical-grid relative h-full w-full overflow-hidden bg-[#020617]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.14),transparent_38rem)]" />
          <div className="absolute inset-x-0 top-24 mx-auto w-[min(520px,calc(100vw-24px))] rounded border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-center text-xs text-amber-100">
            Configure VITE_GOOGLE_MAPS_API_KEY para ativar o GPS real com Google Maps 2D.
          </div>
        </div>
      )}

      <div className="glass-panel absolute bottom-3 left-1/2 z-20 flex w-[min(760px,calc(100vw-24px))] -translate-x-1/2 flex-wrap items-center gap-2 rounded p-2 md:bottom-4">
        <input
          value={zoneName}
          onChange={(event) => setZoneName(event.target.value)}
          className="h-10 min-w-0 flex-1 rounded border border-sky-400/20 bg-slate-950/55 px-3 text-sm outline-none"
        />
        <select
          value={riskLevel}
          onChange={(event) => setRiskLevel(event.target.value as RiskLevel)}
          className="h-10 rounded border border-sky-400/20 bg-slate-950/55 px-2 text-sm outline-none"
        >
          {Object.entries(riskConfig).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
        <MapTool active={drawMode === 'circle'} label="Circulo" icon={<Circle size={17} />} onClick={() => setDrawMode(drawMode === 'circle' ? 'none' : 'circle')} />
        <MapTool active={drawMode === 'polygon'} label="Poligono" icon={<Pentagon size={17} />} onClick={() => setDrawMode(drawMode === 'polygon' ? 'none' : 'polygon')} />
        <MapTool active={drawMode === 'none'} label="Cursor" icon={<MousePointer2 size={17} />} onClick={clearDrawing} />
        <MapTool active={false} label="GPS" icon={<LocateFixed size={17} />} onClick={centerOnGps} />
        {drawMode === 'polygon' && (
          <button onClick={finishPolygon} className="h-10 rounded bg-sky-400 px-3 text-xs font-bold uppercase text-slate-950">
            concluir
          </button>
        )}
      </div>

      <div className="absolute right-3 top-24 z-20 hidden gap-2 md:flex">
        <span className="glass-panel flex h-10 items-center gap-2 rounded px-3 text-xs text-sky-100">
          <Satellite size={15} />
          {satellite ? 'Satelite Google' : 'Google Maps 2D'}
        </span>
        <span className="glass-panel flex h-10 items-center gap-2 rounded px-3 text-xs text-sky-100">
          <Crosshair size={15} />
          {gpsStatus}
        </span>
        <span className="glass-panel flex h-10 items-center gap-2 rounded px-3 text-xs text-sky-100">
          <Hexagon size={15} />
          {zones.length} zonas
        </span>
      </div>

      {drawMode !== 'none' && (
        <button onClick={clearDrawing} className="absolute right-3 top-36 z-20 flex h-10 items-center gap-2 rounded border border-red-400/25 bg-red-500/12 px-3 text-xs text-red-100 md:top-36">
          <X size={15} />
          cancelar desenho
        </button>
      )}
    </main>
  );
}

function MapTool({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={clsx(
        'flex h-10 items-center gap-2 rounded border px-3 text-xs font-semibold uppercase transition',
        active ? 'border-sky-300/40 bg-sky-400/15 text-sky-50' : 'border-sky-400/15 bg-slate-950/45 text-slate-400 hover:text-sky-100',
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function loadGoogleMaps(apiKey: string): Promise<GoogleMapsApi> {
  if (window.google?.maps) return Promise.resolve(window.google.maps);

  const existingScript = document.getElementById(googleMapsScriptId) as HTMLScriptElement | null;
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(window.google.maps), { once: true });
      existingScript.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    window.initGoogleMaps = () => resolve(window.google.maps);
    const script = document.createElement('script');
    script.id = googleMapsScriptId;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=initGoogleMaps`;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function createZone(input: Partial<RiskZone> & Pick<RiskZone, 'name' | 'level' | 'shape'>): RiskZone {
  return {
    id: crypto.randomUUID(),
    name: input.name,
    level: input.level,
    color: riskConfig[input.level].color,
    description: `Area ${riskConfig[input.level].label.toLowerCase()} criada manualmente no mapa operacional.`,
    createdAt: new Date().toISOString(),
    shape: input.shape,
    center: input.center,
    radiusMeters: input.radiusMeters,
    coordinates: input.coordinates,
    active: true,
  };
}

function syncMarkers(maps: GoogleMapsApi, map: GoogleMap, locations: DeviceLocation[], markers: Record<string, GoogleMarker>, infoWindow: GoogleInfoWindow | null) {
  const activeIds = new Set(locations.map((location) => location.id));

  Object.entries(markers).forEach(([id, marker]) => {
    if (!activeIds.has(id)) {
      marker.setMap(null);
      delete markers[id];
    }
  });

  locations.forEach((location) => {
    const position = { lat: location.lat, lng: location.lng };
    if (!markers[location.id]) {
      markers[location.id] = new maps.Marker({
        map,
        position,
        title: `${location.name} | ${location.speed} km/h`,
        icon: buildDeviceIcon(maps, location.status === 'alert'),
      });
      markers[location.id].addListener('click', () => {
        infoWindow?.setContent(buildPopupHtml(location));
        infoWindow?.open({ map, anchor: markers[location.id] });
      });
    } else {
      markers[location.id].setPosition(position);
      markers[location.id].setTitle(`${location.name} | ${location.speed} km/h`);
      markers[location.id].setIcon(buildDeviceIcon(maps, location.status === 'alert'));
    }
  });
}

function syncZones(maps: GoogleMapsApi, map: GoogleMap, zones: RiskZone[], overlays: Record<string, GoogleCircle | GooglePolygon>) {
  const activeIds = new Set(zones.filter((zone) => zone.active).map((zone) => zone.id));
  Object.entries(overlays).forEach(([id, overlay]) => {
    if (!activeIds.has(id)) {
      overlay.setMap(null);
      delete overlays[id];
    }
  });

  zones
    .filter((zone) => zone.active)
    .forEach((zone) => {
      overlays[zone.id]?.setMap(null);
      if (zone.shape === 'circle' && zone.center) {
        overlays[zone.id] = new maps.Circle({
          map,
          center: toGoogleLatLng(zone.center),
          radius: zone.radiusMeters ?? 500,
          strokeColor: zone.color,
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: zone.color,
          fillOpacity: zone.level === 'critico' ? 0.36 : 0.22,
        });
      }

      if (zone.shape === 'polygon' && zone.coordinates?.length) {
        overlays[zone.id] = new maps.Polygon({
          map,
          paths: zone.coordinates.map(toGoogleLatLng),
          strokeColor: zone.color,
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: zone.color,
          fillOpacity: zone.level === 'critico' ? 0.36 : 0.22,
        });
      }
    });
}

function syncHeatOverlay(maps: GoogleMapsApi, map: GoogleMap, locations: DeviceLocation[], visible: boolean, heat: GoogleCircle[]) {
  heat.forEach((circle) => circle.setMap(null));
  heat.splice(0, heat.length);
  if (!visible) return;

  locations.forEach((location) => {
    heat.push(
      new maps.Circle({
        map,
        center: { lat: location.lat, lng: location.lng },
        radius: Math.max(120, location.speed * 6),
        strokeOpacity: 0,
        fillColor: location.status === 'alert' ? '#ef4444' : '#38bdf8',
        fillOpacity: location.status === 'alert' ? 0.24 : 0.16,
        clickable: false,
      }),
    );
  });
}

function syncDraftPolygon(maps: GoogleMapsApi, map: GoogleMap, points: [number, number][], draftRef: MutableRefObject<GooglePolyline | null>) {
  const path = points.length > 2 ? [...points, points[0]] : points;
  if (!draftRef.current) {
    draftRef.current = new maps.Polyline({
      map,
      path: path.map(toGoogleLatLng),
      strokeColor: '#38bdf8',
      strokeOpacity: 0.94,
      strokeWeight: 2,
      clickable: false,
    });
    return;
  }
  draftRef.current.setPath(path.map(toGoogleLatLng));
}

function syncGpsPosition(maps: GoogleMapsApi, map: GoogleMap, position: GoogleLatLng, accuracy: number) {
  const markerIcon = {
    path: maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: '#22c55e',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 3,
  };

  if (!map.__gpsMarker) {
    map.__gpsMarker = new maps.Marker({
      map,
      position,
      title: 'Sua posicao GPS',
      icon: markerIcon,
      zIndex: 999,
    });
    map.panTo(position);
  } else {
    map.__gpsMarker.setPosition(position);
  }

  if (!map.__gpsAccuracy) {
    map.__gpsAccuracy = new maps.Circle({
      map,
      center: position,
      radius: accuracy,
      strokeColor: '#22c55e',
      strokeOpacity: 0.6,
      strokeWeight: 1,
      fillColor: '#22c55e',
      fillOpacity: 0.14,
      clickable: false,
    });
  } else {
    map.__gpsAccuracy.setCenter(position);
    map.__gpsAccuracy.setRadius(accuracy);
  }
}

function buildDeviceIcon(maps: GoogleMapsApi, alert: boolean) {
  return {
    path: maps.SymbolPath.CIRCLE,
    scale: 9,
    fillColor: alert ? '#ef4444' : '#38bdf8',
    fillOpacity: 1,
    strokeColor: '#dbeafe',
    strokeWeight: 2,
  };
}

function buildPopupHtml(location: DeviceLocation) {
  return `
    <div class="google-map-popup">
      <strong>${location.name}</strong>
      <span>Status: ${statusLabel(location.status)}</span>
      <span>Ultima atualizacao: ${new Date(location.updatedAt).toLocaleTimeString('pt-BR')}</span>
      <span>Velocidade: ${location.speed} km/h</span>
      <span>Coordenadas: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}</span>
    </div>`;
}

function toGoogleLatLng(coord: [number, number]): GoogleLatLng {
  return { lat: coord[1], lng: coord[0] };
}

const googleRoadStyle: any[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ saturation: -20 }, { lightness: -5 }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f5f78' }] },
];

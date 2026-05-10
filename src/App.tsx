import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, LocateFixed, LogOut, Moon, Navigation, Shield, Sun } from 'lucide-react';

type GoogleMapsApi = any;
type GoogleMap = any;
type GoogleMarker = any;

type Theme = 'light' | 'dark';

interface VtrAccount {
  id: string;
  name: string;
  password: string;
}

interface VtrLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  accuracy: number;
  updatedAt: number;
  online: boolean;
  isSelf?: boolean;
}

const accountsKey = 'gmduque:vtr-accounts';
const sessionKey = 'gmduque:vtr-session';
const locationsKey = 'gmduque:vtr-locations';
const googleMapsScriptId = 'google-maps-js-api';
const defaultCenter = { lat: -22.7857, lng: -43.3049 };
const movementThresholdMeters = 18;
const minimumGpsAccuracyMeters = 120;
const suspiciousJumpMeters = 90;
const smoothingFactor = 0.38;

declare global {
  interface Window {
    google: { maps: GoogleMapsApi };
    initGoogleMaps?: () => void;
  }
}

export default function App() {
  const [account, setAccount] = useState<VtrAccount | null>(() => getStoredSession());
  const [locations, setLocations] = useState<VtrLocation[]>(() => getStoredLocations());
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('gmduque:theme') as Theme) || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('gmduque:theme', theme);
  }, [theme]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === locationsKey) setLocations(getStoredLocations());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function handleLogin(nextAccount: VtrAccount, remember: boolean) {
    setAccount(nextAccount);
    if (remember) localStorage.setItem(sessionKey, nextAccount.id);
  }

  function handleLogout() {
    localStorage.removeItem(sessionKey);
    setAccount(null);
  }

  if (!account) return <AccessScreen onLogin={handleLogin} theme={theme} onTheme={setTheme} />;

  return (
    <GpsWorkspace
      account={account}
      locations={locations}
      theme={theme}
      onTheme={setTheme}
      onLocations={setLocations}
      onLogout={handleLogout}
    />
  );
}

function AccessScreen({ onLogin, theme, onTheme }: { onLogin: (account: VtrAccount, remember: boolean) => void; theme: Theme; onTheme: (theme: Theme) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanPassword = password.trim();
    if (!cleanName || !cleanPassword) {
      setError('Informe o nome da VTR e a senha.');
      return;
    }

    const accounts = getStoredAccounts();
    const existing = accounts.find((item) => item.name.toLowerCase() === cleanName.toLowerCase());

    if (mode === 'register') {
      if (existing) {
        setError('Essa VTR ja existe. Entre na conta dela.');
        return;
      }
      const account = { id: crypto.randomUUID(), name: cleanName, password: cleanPassword };
      saveAccounts([...accounts, account]);
      onLogin(account, remember);
      return;
    }

    if (!existing || existing.password !== cleanPassword) {
      setError('VTR ou senha invalida.');
      return;
    }
    onLogin(existing, remember);
  }

  return (
    <main className="access-page">
      <button className="theme-button access-theme" onClick={() => onTheme(theme === 'light' ? 'dark' : 'light')} title="Alternar tema">
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <section className="access-card">
        <div className="brand-mark">
          <Shield size={26} />
        </div>
        <p className="eyebrow">Guarda Municipal de Duque de Caxias</p>
        <h1>GPS de Viaturas</h1>

        <div className="mode-switch">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">
            Entrar
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')} type="button">
            Cadastrar VTR
          </button>
        </div>

        <form onSubmit={handleSubmit} className="access-form">
          <label>
            <span>Username da VTR</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: VTR 12" autoComplete="username" />
          </label>
          <label>
            <span>Senha</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha da viatura" type="password" autoComplete="current-password" />
          </label>
          <label className="remember-row">
            <input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" />
            <span>Entrar automaticamente neste aparelho</span>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-action">{mode === 'login' ? 'Entrar no GPS' : 'Cadastrar e entrar'}</button>
        </form>
      </section>
    </main>
  );
}

function GpsWorkspace({
  account,
  locations,
  theme,
  onTheme,
  onLocations,
  onLogout,
}: {
  account: VtrAccount;
  locations: VtrLocation[];
  theme: Theme;
  onTheme: (theme: Theme) => void;
  onLocations: (locations: VtrLocation[]) => void;
  onLogout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('Iniciando GPS');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const mapsRef = useRef<GoogleMapsApi | null>(null);
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<Record<string, GoogleMarker>>({});
  const watchRef = useRef<number | null>(null);
  const lastAcceptedRef = useRef<VtrLocation | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  const onlineLocations = useMemo(
    () => locations.filter((location) => location.online && Date.now() - location.updatedAt < 120000),
    [locations],
  );

  useEffect(() => {
    if (!googleMapsKey || !mapNodeRef.current) return;
    let mounted = true;

    loadGoogleMaps(googleMapsKey).then((maps) => {
      if (!mounted || !mapNodeRef.current) return;
      mapsRef.current = maps;
      const map = new maps.Map(mapNodeRef.current, {
        center: defaultCenter,
        zoom: 16,
        mapTypeId: maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
        clickableIcons: false,
        styles: theme === 'dark' ? darkMapStyle : cleanMapStyle,
      });
      mapRef.current = map;
      startGps(maps, map);
    });

    return () => {
      mounted = false;
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [googleMapsKey]);

  useEffect(() => {
    mapRef.current?.setOptions({ styles: theme === 'dark' ? darkMapStyle : cleanMapStyle });
  }, [theme]);

  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!maps || !map) return;
    syncFleetMarkers(maps, map, onlineLocations, markersRef.current, selectedId);
  }, [onlineLocations, selectedId]);

  function startGps(maps: GoogleMapsApi, map: GoogleMap) {
    if (!window.isSecureContext) {
      setGpsStatus('GPS exige HTTPS');
      return;
    }
    if (!navigator.geolocation) {
      setGpsStatus('GPS indisponivel');
      return;
    }

    setGpsStatus('Buscando posicao');
    watchRef.current = navigator.geolocation.watchPosition(
      (position) => updateOwnLocation(maps, map, position),
      (error) => setGpsStatus(getGpsError(error)),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
    );
  }

  function updateOwnLocation(maps: GoogleMapsApi, map: GoogleMap, position: GeolocationPosition) {
    const next: VtrLocation = {
      id: account.id,
      name: account.name,
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      speed: Math.max(0, Math.round((position.coords.speed ?? 0) * 3.6)),
      heading: Math.round(position.coords.heading ?? lastAcceptedRef.current?.heading ?? 0),
      accuracy: Math.round(position.coords.accuracy),
      updatedAt: Date.now(),
      online: true,
      isSelf: true,
    };

    const last = lastAcceptedRef.current;
    const movedMeters = last ? distanceMeters(last, next) : Number.POSITIVE_INFINITY;

    if (last && next.accuracy > Math.max(minimumGpsAccuracyMeters, last.accuracy * 1.7) && movedMeters > suspiciousJumpMeters) {
      setGpsStatus(`Ignorando salto impreciso (${next.accuracy}m)`);
      return;
    }

    if (last && movedMeters < movementThresholdMeters) {
      setGpsStatus(`GPS estavel (${next.accuracy}m)`);
      return;
    }

    if (next.accuracy > minimumGpsAccuracyMeters && last) {
      setGpsStatus(`Aguardando precisao (${next.accuracy}m)`);
      return;
    }

    const accepted = last ? smoothLocation(last, next) : next;
    lastAcceptedRef.current = accepted;
    setGpsStatus(next.accuracy <= 35 ? `GPS preciso (${next.accuracy}m)` : `GPS aproximado (${next.accuracy}m)`);
    map.panTo({ lat: accepted.lat, lng: accepted.lng });
    if (!last) map.setZoom(17);
    syncOwnVehicle(maps, map, accepted, animationFrameRef);

    const merged = upsertLocation(getStoredLocations(), accepted);
    saveLocations(merged);
    onLocations(merged);
  }

  function locateVtr(location: VtrLocation) {
    setSelectedId(location.id);
    mapRef.current?.panTo({ lat: location.lat, lng: location.lng });
    mapRef.current?.setZoom(18);
  }

  return (
    <main className="gps-shell">
      {!googleMapsKey && <div className="map-warning">Configure VITE_GOOGLE_MAPS_API_KEY para carregar o Google Maps.</div>}
      <div ref={mapNodeRef} className="map-canvas" />

      <header className="top-menu">
        <div className="app-title">
          <span className="title-icon">
            <Shield size={18} />
          </span>
          <div>
            <strong>GM Duque de Caxias</strong>
            <span>{account.name}</span>
          </div>
        </div>
        <button className="menu-trigger" onClick={() => setMenuOpen((value) => !value)}>
          Menu
          <ChevronDown size={16} />
        </button>
        {menuOpen && (
          <div className="dropdown-menu">
            <button onClick={() => onTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
            <button onClick={() => mapRef.current?.panTo(lastAcceptedRef.current || defaultCenter)}>
              <LocateFixed size={16} />
              Minha posicao
            </button>
            <button onClick={onLogout}>
              <LogOut size={16} />
              Sair
            </button>
          </div>
        )}
      </header>

      <div className="gps-pill">
        <Navigation size={15} />
        {gpsStatus}
      </div>

      <aside className="admin-panel">
        <p className="eyebrow">Area admin</p>
        <h2>Viaturas online</h2>
        <div className="vtr-list">
          {onlineLocations.length === 0 && <p className="empty-state">Nenhuma VTR online ainda.</p>}
          {onlineLocations.map((location) => (
            <article className={location.id === selectedId ? 'vtr-card selected' : 'vtr-card'} key={location.id}>
              <div>
                <strong>{location.name}</strong>
                <span>{location.speed} km/h | {location.accuracy}m</span>
              </div>
              <button onClick={() => locateVtr(location)}>
                <LocateFixed size={16} />
                Localizar
              </button>
            </article>
          ))}
        </div>
      </aside>
    </main>
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

function syncFleetMarkers(maps: GoogleMapsApi, map: GoogleMap, locations: VtrLocation[], markers: Record<string, GoogleMarker>, selectedId: string | null) {
  const fleetLocations = locations.filter((location) => !location.isSelf);
  const activeIds = new Set(fleetLocations.map((location) => location.id));
  Object.entries(markers).forEach(([id, marker]) => {
    if (!activeIds.has(id)) {
      marker.setMap(null);
      delete markers[id];
    }
  });

  fleetLocations.forEach((location) => {
    const position = { lat: location.lat, lng: location.lng };
    const icon = buildVehicleIcon(location, location.id === selectedId);

    if (!markers[location.id]) {
      markers[location.id] = new maps.Marker({
        map,
        position,
        title: `${location.name} | ${location.speed} km/h`,
        icon,
      });
      return;
    }

    markers[location.id].setPosition(position);
    markers[location.id].setTitle(`${location.name} | ${location.speed} km/h`);
    markers[location.id].setIcon(icon);
  });
}

function syncOwnVehicle(maps: GoogleMapsApi, map: GoogleMap, location: VtrLocation, animationFrameRef: React.MutableRefObject<number | null>) {
  const center = { lat: location.lat, lng: location.lng };
  if (!map.__selfMarker) {
    map.__selfMarker = new maps.Marker({
      map,
      position: center,
      title: location.name,
      icon: buildVehicleIcon(location, true),
      zIndex: 999,
    });
  } else {
    animateMarkerTo(map.__selfMarker, center, animationFrameRef);
    map.__selfMarker.setIcon(buildVehicleIcon(location, true));
  }

  if (!map.__accuracyCircle) {
    map.__accuracyCircle = new maps.Circle({
      map,
      center,
      radius: location.accuracy,
      strokeColor: '#176b3a',
      strokeOpacity: 0.32,
      strokeWeight: 1,
      fillColor: '#176b3a',
      fillOpacity: 0.08,
      clickable: false,
    });
  } else {
    map.__accuracyCircle.setCenter(center);
    map.__accuracyCircle.setRadius(location.accuracy);
  }
}

function buildVehicleIcon(location: Pick<VtrLocation, 'isSelf' | 'heading'>, selected = false) {
  const fillColor = location.isSelf ? '#176b3a' : '#1057a8';
  return {
    path: 'M -8 -16 C -10 -16 -12 -13 -12 -10 L -12 10 C -12 14 -9 17 -5 17 L 5 17 C 9 17 12 14 12 10 L 12 -10 C 12 -13 10 -16 8 -16 Z M -6 -9 L 6 -9 L 5 -2 L -5 -2 Z M -8 6 L -3 6 L -3 12 L -8 12 Z M 3 6 L 8 6 L 8 12 L 3 12 Z M -9 -13 L -13 -8 L -12 -3 L -9 -7 Z M 9 -13 L 13 -8 L 12 -3 L 9 -7 Z',
    anchor: { x: 0, y: 0 },
    rotation: location.heading || 0,
    scale: selected ? 1.18 : 1,
    fillColor,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1.8,
  };
}

function animateMarkerTo(marker: GoogleMarker, target: { lat: number; lng: number }, frameRef: React.MutableRefObject<number | null>) {
  const startPosition = marker.getPosition();
  if (!startPosition) {
    marker.setPosition(target);
    return;
  }

  const start = { lat: startPosition.lat(), lng: startPosition.lng() };
  const startTime = performance.now();
  const duration = 650;

  if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

  const step = (time: number) => {
    const progress = Math.min(1, (time - startTime) / duration);
    const eased = 1 - (1 - progress) ** 3;
    marker.setPosition({
      lat: start.lat + (target.lat - start.lat) * eased,
      lng: start.lng + (target.lng - start.lng) * eased,
    });
    if (progress < 1) frameRef.current = requestAnimationFrame(step);
  };

  frameRef.current = requestAnimationFrame(step);
}

function smoothLocation(last: VtrLocation, next: VtrLocation): VtrLocation {
  return {
    ...next,
    lat: last.lat + (next.lat - last.lat) * smoothingFactor,
    lng: last.lng + (next.lng - last.lng) * smoothingFactor,
    accuracy: Math.min(next.accuracy, Math.max(last.accuracy, next.accuracy)),
  };
}

function getStoredAccounts() {
  return readJson<VtrAccount[]>(accountsKey, []);
}

function saveAccounts(accounts: VtrAccount[]) {
  localStorage.setItem(accountsKey, JSON.stringify(accounts));
}

function getStoredSession() {
  const id = localStorage.getItem(sessionKey);
  if (!id) return null;
  return getStoredAccounts().find((account) => account.id === id) || null;
}

function getStoredLocations() {
  const stored = readJson<VtrLocation[]>(locationsKey, []);
  return stored.filter((location) => Date.now() - location.updatedAt < 180000);
}

function saveLocations(locations: VtrLocation[]) {
  localStorage.setItem(locationsKey, JSON.stringify(locations));
}

function upsertLocation(locations: VtrLocation[], next: VtrLocation) {
  return [next, ...locations.filter((location) => location.id !== next.id)].slice(0, 80);
}

function readJson<T>(key: string, fallback: T) {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function distanceMeters(a: Pick<VtrLocation, 'lat' | 'lng'>, b: Pick<VtrLocation, 'lat' | 'lng'>) {
  const earthRadius = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function getGpsError(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) return 'Permita o GPS no navegador';
  if (error.code === error.POSITION_UNAVAILABLE) return 'GPS indisponivel';
  if (error.code === error.TIMEOUT) return 'GPS demorou para responder';
  return 'Erro no GPS';
}

const cleanMapStyle = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1f2933' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#d6dde8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111827' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2f3a47' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f3b46' }] },
];

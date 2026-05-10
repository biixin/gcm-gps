import { useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { NotificationCenter } from '../components/NotificationCenter';
import { Sidebar } from '../components/Sidebar';
import { TacticalMap } from '../components/TacticalMap';
import { useRealtimeLocations } from '../hooks/useRealtimeLocations';
import { useRiskZones } from '../hooks/useRiskZones';
import { useSystemFeed } from '../hooks/useSystemFeed';
import { DEFAULT_CENTER } from '../utils/geo';

export function OperationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('todos');
  const [satellite, setSatellite] = useState(false);
  const [heatmap, setHeatmap] = useState(true);
  const [autoZoomKey, setAutoZoomKey] = useState(0);
  const { filteredLocations, locations } = useRealtimeLocations(search, category);
  const { zones, saveZone } = useRiskZones();
  const { events } = useSystemFeed();

  const criticalAlerts = useMemo(() => events.filter((event) => event.severity === 'critico').length, [events]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-tactical-ink">
      <TacticalMap
        key={autoZoomKey}
        locations={filteredLocations}
        zones={zones}
        satellite={satellite}
        heatmap={heatmap}
        onCreateZone={saveZone}
      />
      <Header alerts={criticalAlerts} onToggleSidebar={() => setSidebarOpen((value) => !value)} />
      <Sidebar
        open={sidebarOpen}
        search={search}
        category={category}
        satellite={satellite}
        heatmap={heatmap}
        locations={filteredLocations}
        zones={zones}
        onSearch={setSearch}
        onCategory={setCategory}
        onSatellite={() => setSatellite((value) => !value)}
        onHeatmap={() => setHeatmap((value) => !value)}
        onAutoZoom={() => setAutoZoomKey((value) => value + 1)}
      />
      <NotificationCenter events={events} />
      <div className="glass-panel absolute bottom-3 left-3 z-10 hidden rounded px-3 py-2 text-[11px] text-slate-400 md:block">
        Centro: {DEFAULT_CENTER[1].toFixed(4)}, {DEFAULT_CENTER[0].toFixed(4)} | Total monitorado: {locations.length}
      </div>
    </div>
  );
}

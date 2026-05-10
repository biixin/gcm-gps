import { Crosshair, Eye, Layers, Radar, Search, ShieldAlert, Users } from 'lucide-react';
import { clsx } from 'clsx';
import type { DeviceLocation, RiskZone } from '../types';
import { riskConfig, statusLabel } from '../utils/risk';

interface SidebarProps {
  open: boolean;
  search: string;
  category: string;
  satellite: boolean;
  heatmap: boolean;
  locations: DeviceLocation[];
  zones: RiskZone[];
  onSearch: (value: string) => void;
  onCategory: (value: string) => void;
  onSatellite: () => void;
  onHeatmap: () => void;
  onAutoZoom: () => void;
}

export function Sidebar({
  open,
  search,
  category,
  satellite,
  heatmap,
  locations,
  zones,
  onSearch,
  onCategory,
  onSatellite,
  onHeatmap,
  onAutoZoom,
}: SidebarProps) {
  const categories = ['todos', ...Array.from(new Set(locations.map((location) => location.category)))];

  return (
    <aside
      className={clsx(
        'glass-panel absolute bottom-3 left-3 top-24 z-20 flex w-[min(360px,calc(100vw-24px))] flex-col rounded transition-transform duration-300 md:bottom-4 md:left-4 md:top-24',
        open ? 'translate-x-0' : '-translate-x-[calc(100%+24px)] md:translate-x-0',
      )}
    >
      <div className="border-b border-sky-400/15 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/80">
          <Radar size={15} />
          Comando operacional
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Metric icon={<Users size={16} />} label="Ativos" value={locations.length.toString()} />
          <Metric icon={<ShieldAlert size={16} />} label="Zonas" value={zones.length.toString()} />
          <Metric icon={<Eye size={16} />} label="Online" value={locations.filter((item) => item.status !== 'offline').length.toString()} />
        </div>
      </div>

      <div className="space-y-3 border-b border-sky-400/15 p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sky-200/50" size={17} />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Buscar usuario ou local"
            className="h-11 w-full rounded border border-sky-400/20 bg-slate-950/55 pl-10 pr-3 text-sm text-sky-50 outline-none transition placeholder:text-slate-500 focus:border-sky-300/60"
          />
        </label>
        <select
          value={category}
          onChange={(event) => onCategory(event.target.value)}
          className="h-11 w-full rounded border border-sky-400/20 bg-slate-950/55 px-3 text-sm text-sky-50 outline-none"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item === 'todos' ? 'Todas as categorias' : item}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-3 gap-2">
          <Tool active={satellite} icon={<Layers size={16} />} label="Satelite" onClick={onSatellite} />
          <Tool active={heatmap} icon={<Radar size={16} />} label="Heatmap" onClick={onHeatmap} />
          <Tool active icon={<Crosshair size={16} />} label="Zoom" onClick={onAutoZoom} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-sky-200/70">Dispositivos</p>
        <div className="space-y-2">
          {locations.map((location) => (
            <div key={location.id} className="rounded border border-sky-400/12 bg-slate-950/42 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-sky-50">{location.name}</p>
                  <p className="text-xs text-slate-400">{location.category}</p>
                </div>
                <span
                  className={clsx(
                    'rounded px-2 py-1 text-[10px] font-bold uppercase',
                    location.status === 'alert' ? 'bg-red-500/20 text-red-100' : 'bg-sky-400/10 text-sky-100',
                  )}
                >
                  {statusLabel(location.status)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                <span>{location.speed} km/h</span>
                <span>
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-sky-200/70">Areas de perigo</p>
        <div className="space-y-2">
          {zones.map((zone) => (
            <div key={zone.id} className="rounded border border-sky-400/12 bg-slate-950/42 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-sky-50">{zone.name}</p>
                <span className="rounded px-2 py-1 text-[10px] font-bold uppercase" style={{ backgroundColor: riskConfig[zone.level].bg, color: riskConfig[zone.level].color }}>
                  {riskConfig[zone.level].label}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">{zone.description}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded border border-sky-400/12 bg-slate-950/45 p-3">
      <div className="mb-2 text-sky-200/70">{icon}</div>
      <p className="text-lg font-bold text-sky-50">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
    </div>
  );
}

function Tool({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex h-12 flex-col items-center justify-center gap-1 rounded border text-[10px] font-semibold uppercase transition',
        active ? 'border-sky-300/40 bg-sky-400/15 text-sky-100' : 'border-sky-400/15 bg-slate-950/35 text-slate-400 hover:text-sky-100',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

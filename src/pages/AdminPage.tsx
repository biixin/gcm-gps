import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Activity, ArrowLeft, Database, LogOut, MapPin, ShieldAlert, Trash2, UserCog } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeLocations } from '../hooks/useRealtimeLocations';
import { useRiskZones } from '../hooks/useRiskZones';
import { useSystemFeed } from '../hooks/useSystemFeed';
import { realtimeService } from '../services/realtimeService';
import type { DeviceLocation, RiskLevel } from '../types';
import { DEFAULT_CENTER } from '../utils/geo';
import { mockUsers } from '../utils/mockData';
import { riskConfig, statusLabel } from '../utils/risk';

export function AdminPage() {
  const { session, logout } = useAuth();
  const { locations } = useRealtimeLocations();
  const { zones, saveZone, deleteZone } = useRiskZones();
  const { events, logs } = useSystemFeed();
  const [newLocationName, setNewLocationName] = useState('Nova Unidade');

  function addLocation(event: FormEvent) {
    event.preventDefault();
    const location: DeviceLocation = {
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      name: newLocationName,
      category: 'Patrulha',
      status: 'online',
      lat: DEFAULT_CENTER[1] + (Math.random() - 0.5) * 0.03,
      lng: DEFAULT_CENTER[0] + (Math.random() - 0.5) * 0.03,
      speed: Math.round(Math.random() * 45),
      heading: Math.round(Math.random() * 360),
      updatedAt: new Date().toISOString(),
    };
    realtimeService.addLocation(location);
    setNewLocationName('Nova Unidade');
  }

  function updateZoneColor(id: string, color: string) {
    const zone = zones.find((item) => item.id === id);
    if (zone) saveZone({ ...zone, color });
  }

  function updateZoneLevel(id: string, level: RiskLevel) {
    const zone = zones.find((item) => item.id === id);
    if (zone) saveZone({ ...zone, level, color: riskConfig[level].color });
  }

  return (
    <main className="min-h-screen overflow-auto bg-tactical-ink p-4 text-sky-50 md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <header className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded p-4">
          <div className="flex min-w-0 items-center gap-3">
            <Logo />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold uppercase tracking-[0.16em] md:text-base">Painel administrativo</h1>
              <p className="text-xs text-slate-400">{session?.user.email} | permissao {session?.user.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="flex h-10 items-center gap-2 rounded border border-sky-400/20 bg-sky-400/10 px-3 text-xs font-semibold text-sky-100">
              <ArrowLeft size={16} />
              Operacao
            </Link>
            <button onClick={logout} className="flex h-10 items-center gap-2 rounded border border-red-400/20 bg-red-500/10 px-3 text-xs font-semibold text-red-100">
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <AdminMetric icon={<MapPin size={18} />} label="Localizacoes" value={locations.length.toString()} />
          <AdminMetric icon={<ShieldAlert size={18} />} label="Zonas de risco" value={zones.length.toString()} />
          <AdminMetric icon={<Activity size={18} />} label="Eventos" value={events.length.toString()} />
          <AdminMetric icon={<Database size={18} />} label="Logs" value={logs.length.toString()} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-panel rounded p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-sky-100">Gerenciamento de usuarios</h2>
                <p className="mt-1 text-xs text-slate-400">Permissoes, rastreamento e categorias operacionais.</p>
              </div>
              <form onSubmit={addLocation} className="flex gap-2">
                <input
                  value={newLocationName}
                  onChange={(event) => setNewLocationName(event.target.value)}
                  className="h-10 w-40 rounded border border-sky-400/20 bg-slate-950/55 px-3 text-sm outline-none"
                />
                <button className="h-10 rounded bg-sky-400 px-3 text-xs font-bold uppercase text-slate-950">adicionar</button>
              </form>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-3">Usuario</th>
                    <th>Categoria</th>
                    <th>Status</th>
                    <th>Velocidade</th>
                    <th>Rastreamento</th>
                    <th className="text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location) => (
                    <tr key={location.id} className="bg-slate-950/45">
                      <td className="rounded-l px-3 py-3 font-semibold text-sky-50">{location.name}</td>
                      <td className="text-slate-300">{location.category}</td>
                      <td className="text-slate-300">{statusLabel(location.status)}</td>
                      <td className="text-slate-300">{location.speed} km/h</td>
                      <td>
                        <button onClick={() => realtimeService.toggleTracking(location.userId)} className="rounded border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs text-sky-100">
                          alternar
                        </button>
                      </td>
                      <td className="rounded-r px-3 text-right">
                        <button onClick={() => realtimeService.removeLocation(location.id)} className="inline-flex h-8 w-8 items-center justify-center rounded border border-red-400/20 bg-red-500/10 text-red-100">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel rounded p-4">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-sky-100">Areas de risco</h2>
            <div className="space-y-3">
              {zones.map((zone) => (
                <article key={zone.id} className="rounded border border-sky-400/12 bg-slate-950/45 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-sky-50">{zone.name}</h3>
                      <p className="mt-1 text-xs text-slate-400">{zone.description}</p>
                    </div>
                    <button onClick={() => deleteZone(zone.id)} className="flex h-8 w-8 items-center justify-center rounded border border-red-400/20 bg-red-500/10 text-red-100">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                    <select
                      value={zone.level}
                      onChange={(event) => updateZoneLevel(zone.id, event.target.value as RiskLevel)}
                      className="h-10 rounded border border-sky-400/20 bg-slate-950/65 px-3 text-sm outline-none"
                    >
                      {Object.entries(riskConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="color"
                      value={zone.color}
                      onChange={(event) => updateZoneColor(zone.id, event.target.value)}
                      className="h-10 w-12 rounded border border-sky-400/20 bg-slate-950/65"
                      aria-label="Alterar cor da zona"
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="glass-panel rounded p-4 xl:col-span-2">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-sky-100">Eventos recentes</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="pb-3">Horario</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3">Evento</th>
                    <th className="pb-3">Risco</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-400/10">
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="py-3 text-slate-400">{format(new Date(event.createdAt), 'HH:mm:ss')}</td>
                      <td className="py-3 text-slate-300">{event.type}</td>
                      <td className="py-3">
                        <p className="font-semibold text-sky-50">{event.title}</p>
                        <p className="text-xs text-slate-400">{event.description}</p>
                      </td>
                      <td className="py-3">
                        <span className="rounded px-2 py-1 text-xs font-bold" style={{ backgroundColor: riskConfig[event.severity].bg, color: riskConfig[event.severity].color }}>
                          {riskConfig[event.severity].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel rounded p-4">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-sky-100">Logs do sistema</h2>
            <div className="space-y-2">
              {logs.slice(0, 8).map((log) => (
                <div key={log.id} className="rounded border border-sky-400/12 bg-slate-950/45 p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-sky-200/70">{log.scope}</p>
                  <p className="mt-1 text-sm text-slate-300">{log.message}</p>
                  <p className="mt-2 text-[11px] text-slate-500">{format(new Date(log.createdAt), 'HH:mm:ss')}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-panel rounded p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-sky-100">
            <UserCog size={18} />
            Collections/tabelas previstas
          </div>
          <div className="grid gap-2 text-sm text-slate-300 md:grid-cols-5">
            {['usuarios', 'localizacoes', 'zonas_de_risco', 'logs', 'eventos'].map((item) => (
              <div key={item} className="rounded border border-sky-400/12 bg-slate-950/45 p-3 font-mono text-xs">
                {item}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Usuarios mockados: {mockUsers.map((user) => `${user.name} (${user.role})`).join(', ')}.
          </p>
        </section>
      </div>
    </main>
  );
}

function AdminMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-panel rounded p-4">
      <div className="mb-3 text-sky-200">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.13em] text-slate-500">{label}</p>
    </div>
  );
}

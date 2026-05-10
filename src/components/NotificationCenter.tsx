import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { SystemEvent } from '../types';
import { riskConfig } from '../utils/risk';

export function NotificationCenter({ events }: { events: SystemEvent[] }) {
  return (
    <section className="glass-panel absolute bottom-3 right-3 z-20 hidden w-[360px] rounded p-4 xl:block">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200/70">Eventos recentes</p>
        <span className="rounded bg-red-500/15 px-2 py-1 text-[10px] font-bold text-red-100">tempo real</span>
      </div>
      <div className="space-y-2">
        {events.slice(0, 4).map((event) => (
          <article key={event.id} className="rounded border border-sky-400/12 bg-slate-950/45 p-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-sky-50">{event.title}</h3>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: riskConfig[event.severity].color }} />
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-400">{event.description}</p>
            <p className="mt-2 text-[11px] text-slate-500">
              {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: ptBR })}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

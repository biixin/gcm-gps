import { Bell, LogIn, Menu, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  alerts: number;
  onToggleSidebar: () => void;
}

export function Header({ alerts, onToggleSidebar }: HeaderProps) {
  const { isAuthenticated, session } = useAuth();

  return (
    <header className="glass-panel absolute left-3 right-3 top-3 z-30 flex h-16 items-center justify-between gap-3 rounded px-3 md:left-4 md:right-4 md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          className="flex h-10 w-10 items-center justify-center rounded border border-sky-400/20 bg-slate-950/40 text-sky-100 md:hidden"
          onClick={onToggleSidebar}
          aria-label="Abrir painel"
        >
          <Menu size={18} />
        </button>
        <Logo />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-sky-100 md:text-base">
            Plataforma de Inteligencia Aplicada Regional
          </h1>
          <p className="hidden text-xs text-sky-200/65 sm:block">Centro operacional | monitoramento tatico em tempo real</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200 sm:flex">
          <ShieldCheck size={15} />
          Canal seguro
        </div>
        <div className="relative flex h-10 w-10 items-center justify-center rounded border border-red-400/20 bg-red-500/10 text-red-100">
          <Bell size={18} />
          {alerts > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold">
              {alerts}
            </span>
          )}
        </div>
        <Link
          to={isAuthenticated ? '/admin' : '/login'}
          className="flex h-10 items-center gap-2 rounded border border-sky-400/25 bg-sky-400/10 px-3 text-xs font-semibold text-sky-100 transition hover:bg-sky-400/20"
        >
          <LogIn size={16} />
          <span className="hidden sm:inline">{session?.user.name ?? 'Admin'}</span>
        </Link>
      </div>
    </header>
  );
}

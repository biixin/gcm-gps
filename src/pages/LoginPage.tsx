import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock, Mail, Shield } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@piar.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="tactical-grid flex min-h-screen items-center justify-center overflow-auto bg-tactical-ink p-4">
      <form onSubmit={handleSubmit} className="glass-panel w-full max-w-md rounded p-6">
        <div className="mb-8 flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="text-base font-semibold uppercase tracking-[0.16em] text-sky-50">Acesso administrativo</h1>
            <p className="mt-1 text-sm text-slate-400">Painel protegido por sessao JWT local.</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-sky-200/70">Email</span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded border border-sky-400/20 bg-slate-950/55 pl-10 pr-3 outline-none focus:border-sky-300/60"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-sky-200/70">Senha</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="h-12 w-full rounded border border-sky-400/20 bg-slate-950/55 pl-10 pr-3 outline-none focus:border-sky-300/60"
              />
            </div>
          </label>
        </div>

        {error && <p className="mt-4 rounded border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}

        <button
          disabled={loading}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded bg-sky-400 text-sm font-bold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-sky-300 disabled:opacity-60"
        >
          <Shield size={18} />
          {loading ? 'validando' : 'entrar'}
        </button>
      </form>
    </main>
  );
}

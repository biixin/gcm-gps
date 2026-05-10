import type { RiskLevel } from '../types';

export const riskConfig: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  baixo: { label: 'Baixo', color: '#facc15', bg: 'rgba(250, 204, 21, 0.24)' },
  medio: { label: 'Medio', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.24)' },
  alto: { label: 'Alto', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.26)' },
  critico: { label: 'Critico', color: '#7f1d1d', bg: 'rgba(127, 29, 29, 0.46)' },
};

export function statusLabel(status: string) {
  return {
    online: 'Online',
    offline: 'Offline',
    alert: 'Alerta',
    idle: 'Ocioso',
  }[status] ?? status;
}

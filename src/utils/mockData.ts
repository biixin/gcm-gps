import type { AppUser, DeviceLocation, RiskZone, SystemEvent, SystemLog } from '../types';
import { encryptSensitiveValue } from './security';

const now = new Date();

export const mockUsers: AppUser[] = [
  {
    id: 'u-001',
    name: 'Central Alfa',
    email: 'admin@piar.local',
    role: 'admin',
    category: 'Comando',
    trackingEnabled: true,
    encryptedDocument: encryptSensitiveValue('00.000.000/0001-00'),
  },
  {
    id: 'u-102',
    name: 'Equipe Norte',
    email: 'norte@piar.local',
    role: 'operator',
    category: 'Patrulha',
    trackingEnabled: true,
    encryptedDocument: encryptSensitiveValue('REG-NORTE-102'),
  },
  {
    id: 'u-205',
    name: 'Unidade Medica 7',
    email: 'medica7@piar.local',
    role: 'operator',
    category: 'Saude',
    trackingEnabled: true,
    encryptedDocument: encryptSensitiveValue('REG-SAUDE-205'),
  },
  {
    id: 'u-318',
    name: 'Drone Observador',
    email: 'drone@piar.local',
    role: 'viewer',
    category: 'Aereo',
    trackingEnabled: true,
    encryptedDocument: encryptSensitiveValue('DRONE-318'),
  },
];

export const mockLocations: DeviceLocation[] = [
  {
    id: 'loc-102',
    userId: 'u-102',
    name: 'Equipe Norte',
    category: 'Patrulha',
    status: 'online',
    lat: -23.5457,
    lng: -46.6419,
    speed: 38,
    heading: 82,
    updatedAt: now.toISOString(),
  },
  {
    id: 'loc-205',
    userId: 'u-205',
    name: 'Unidade Medica 7',
    category: 'Saude',
    status: 'alert',
    lat: -23.5576,
    lng: -46.6261,
    speed: 22,
    heading: 41,
    updatedAt: now.toISOString(),
  },
  {
    id: 'loc-318',
    userId: 'u-318',
    name: 'Drone Observador',
    category: 'Aereo',
    status: 'online',
    lat: -23.551,
    lng: -46.6528,
    speed: 64,
    heading: 212,
    updatedAt: now.toISOString(),
  },
  {
    id: 'loc-411',
    userId: 'u-411',
    name: 'Viatura Leste',
    category: 'Patrulha',
    status: 'idle',
    lat: -23.5634,
    lng: -46.6373,
    speed: 4,
    heading: 118,
    updatedAt: now.toISOString(),
  },
];

export const mockZones: RiskZone[] = [
  {
    id: 'zone-01',
    name: 'Perimetro Luz',
    level: 'alto',
    color: '#ef4444',
    description: 'Ocorrencias recorrentes nas ultimas 6 horas.',
    createdAt: new Date(now.getTime() - 86400000).toISOString(),
    shape: 'polygon',
    coordinates: [
      [-46.6357, -23.5358],
      [-46.6246, -23.5389],
      [-46.6274, -23.5486],
      [-46.6385, -23.5461],
      [-46.6357, -23.5358],
    ],
    active: true,
  },
  {
    id: 'zone-02',
    name: 'Zona Baixa Paulista',
    level: 'medio',
    color: '#fb923c',
    description: 'Area sob observacao preventiva.',
    createdAt: new Date(now.getTime() - 172800000).toISOString(),
    shape: 'circle',
    center: [-46.6557, -23.5614],
    radiusMeters: 720,
    active: true,
  },
  {
    id: 'zone-03',
    name: 'Nucleo Critico Se',
    level: 'critico',
    color: '#7f1d1d',
    description: 'Bloqueio operacional e notificacoes prioritarias.',
    createdAt: new Date(now.getTime() - 3600000).toISOString(),
    shape: 'circle',
    center: [-46.6333, -23.5505],
    radiusMeters: 430,
    active: true,
  },
];

export const mockEvents: SystemEvent[] = [
  {
    id: 'evt-1',
    type: 'risk',
    title: 'Entrada em zona critica',
    description: 'Unidade Medica 7 cruzou Nucleo Critico Se.',
    severity: 'critico',
    createdAt: new Date(now.getTime() - 180000).toISOString(),
  },
  {
    id: 'evt-2',
    type: 'movement',
    title: 'Velocidade elevada',
    description: 'Drone Observador acima de 60 km/h.',
    severity: 'medio',
    createdAt: new Date(now.getTime() - 420000).toISOString(),
  },
  {
    id: 'evt-3',
    type: 'tracking',
    title: 'Rastreamento ativo',
    description: 'Equipe Norte enviando telemetria em tempo real.',
    severity: 'baixo',
    createdAt: new Date(now.getTime() - 900000).toISOString(),
  },
];

export const mockLogs: SystemLog[] = [
  { id: 'log-1', scope: 'auth', message: 'Sessao administrativa validada via JWT.', createdAt: now.toISOString() },
  { id: 'log-2', scope: 'realtime', message: 'Canal locations:mock conectado.', createdAt: now.toISOString() },
  { id: 'log-3', scope: 'zones', message: 'Camada de zonas sincronizada.', createdAt: now.toISOString() },
];

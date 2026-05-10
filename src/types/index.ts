export type UserRole = 'admin' | 'operator' | 'viewer';
export type DeviceStatus = 'online' | 'offline' | 'alert' | 'idle';
export type RiskLevel = 'baixo' | 'medio' | 'alto' | 'critico';
export type ZoneShape = 'circle' | 'polygon';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  category: string;
  trackingEnabled: boolean;
  encryptedDocument: string;
}

export interface DeviceLocation {
  id: string;
  userId: string;
  name: string;
  category: string;
  status: DeviceStatus;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  updatedAt: string;
}

export interface RiskZone {
  id: string;
  name: string;
  level: RiskLevel;
  color: string;
  description: string;
  createdAt: string;
  shape: ZoneShape;
  center?: [number, number];
  radiusMeters?: number;
  coordinates?: [number, number][];
  active: boolean;
}

export interface SystemEvent {
  id: string;
  type: 'login' | 'movement' | 'risk' | 'system' | 'tracking';
  title: string;
  description: string;
  severity: RiskLevel;
  createdAt: string;
}

export interface SystemLog {
  id: string;
  scope: string;
  message: string;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  user: AppUser;
  expiresAt: number;
}

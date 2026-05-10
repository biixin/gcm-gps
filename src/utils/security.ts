const salt = 'piar-local-demo';

export function createDemoJwt(userId: string, role: string) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: userId, role, iat: Date.now() }));
  const signature = btoa(`${userId}.${role}.${salt}`).replace(/=/g, '');
  return `${header}.${payload}.${signature}`;
}

// Camada simples para mock local. Em produção, substitua por KMS/crypto do backend.
export function encryptSensitiveValue(value: string) {
  return btoa(`${salt}:${value}`).split('').reverse().join('');
}

export function decryptSensitiveValue(value: string) {
  try {
    return atob(value.split('').reverse().join('')).replace(`${salt}:`, '');
  } catch {
    return '';
  }
}

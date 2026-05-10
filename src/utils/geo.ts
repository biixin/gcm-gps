export const DEFAULT_CENTER: [number, number] = [-46.6333, -23.5505];

export function jitterCoordinate(value: number, amount = 0.00045) {
  return value + (Math.random() - 0.5) * amount;
}

export function circleToPolygon(center: [number, number], radiusMeters: number, points = 72) {
  const coords: [number, number][] = [];
  const earthRadius = 6378137;
  const [lng, lat] = center;
  const latRad = (lat * Math.PI) / 180;

  for (let i = 0; i <= points; i += 1) {
    const angle = (i / points) * Math.PI * 2;
    const dx = radiusMeters * Math.cos(angle);
    const dy = radiusMeters * Math.sin(angle);
    const pointLat = lat + (dy / earthRadius) * (180 / Math.PI);
    const pointLng = lng + (dx / (earthRadius * Math.cos(latRad))) * (180 / Math.PI);
    coords.push([pointLng, pointLat]);
  }

  return coords;
}

// Builds simple 3D "depth bars" along a route so the dashboard can show depth
// as extruded ribbons. Height = depth in metres (visual aid only, the pipe is
// really below ground).
const M_PER_LAT = 111320;

function ribbonPolygons(feature, widthM, heightM, kind) {
  const coords = feature.geometry.coordinates;
  const lat0 = coords[0][1];
  const mPerLng = M_PER_LAT * Math.cos((lat0 * Math.PI) / 180);
  const half = widthM / 2;
  const out = [];
  for (let i = 0; i < coords.length - 1; i += 1) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[i + 1];
    const dx = (x2 - x1) * mPerLng;
    const dy = (y2 - y1) * M_PER_LAT;
    const len = Math.hypot(dx, dy);
    if (len === 0) continue;
    const offLng = ((-dy / len) * half) / mPerLng;
    const offLat = ((dx / len) * half) / M_PER_LAT;
    const ring = [
      [x1 + offLng, y1 + offLat],
      [x2 + offLng, y2 + offLat],
      [x2 - offLng, y2 - offLat],
      [x1 - offLng, y1 - offLat],
      [x1 + offLng, y1 + offLat],
    ];
    out.push({
      type: 'Feature',
      properties: { kind, height: heightM },
      geometry: { type: 'Polygon', coordinates: [ring] },
    });
  }
  return out;
}

export function buildDepthBars(routeData, plannedDepthM, actualDepthM) {
  const planned = routeData.features.find((f) => f.properties.kind === 'planned');
  const actual = routeData.features.find((f) => f.properties.kind === 'actual');
  return {
    type: 'FeatureCollection',
    features: [
      ...ribbonPolygons(planned, 0.9, plannedDepthM, 'planned'),
      ...ribbonPolygons(actual, 0.5, actualDepthM, 'actual'),
    ],
  };
}

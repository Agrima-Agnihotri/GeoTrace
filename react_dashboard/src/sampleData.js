// All coordinates are [longitude, latitude]. This is MOCK data, not a real site.
// The actual route detours about 6 m east around a boulder.

export const record = {
  id: 'REC-0001',
  utility: 'Water',
  site: 'Sample site (mock data)',
  plannedDepthM: 1.2,
  actualDepthM: 1.6,
  maxDeviationM: 6.0,
};

export const routeData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { kind: 'planned' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [75.87, 26.4],
          [75.87, 26.4004],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { kind: 'actual' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [75.87, 26.4],
          [75.87, 26.40015],
          [75.87006, 26.4002],
          [75.87, 26.40025],
          [75.87, 26.4004],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { kind: 'deviation' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [75.87, 26.40015],
          [75.87006, 26.4002],
          [75.87, 26.40025],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { kind: 'survey', label: 'S1' },
      geometry: { type: 'Point', coordinates: [75.87, 26.40015] },
    },
    {
      type: 'Feature',
      properties: { kind: 'survey', label: 'S2' },
      geometry: { type: 'Point', coordinates: [75.87006, 26.4002] },
    },
    {
      type: 'Feature',
      properties: { kind: 'survey', label: 'S3' },
      geometry: { type: 'Point', coordinates: [75.87, 26.40025] },
    },
  ],
};

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const style = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const kind = (k) => ['==', ['get', 'kind'], k];

export default function DeviationMap({ data }) {
  const container = useRef(null);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: container.current,
      style,
      center: [75.87003, 26.4002],
      zoom: 18.5,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      map.addSource('route', { type: 'geojson', data });

      map.addLayer({
        id: 'planned',
        type: 'line',
        source: 'route',
        filter: kind('planned'),
       paint: { 'line-color': '#0891b2', 'line-width': 4, 'line-dasharray': [2, 2] },
      });
      map.addLayer({
        id: 'actual',
        type: 'line',
        source: 'route',
        filter: kind('actual'),
        paint: { 'line-color': '#2563eb', 'line-width': 4 },
      });
      map.addLayer({
        id: 'deviation',
        type: 'line',
        source: 'route',
        filter: kind('deviation'),
        paint: { 'line-color': '#ef4444', 'line-width': 7, 'line-opacity': 0.8 },
      });
      map.addLayer({
        id: 'survey',
        type: 'circle',
        source: 'route',
        filter: kind('survey'),
        paint: {
          'circle-radius': 6,
          'circle-color': '#fb923c',
          'circle-stroke-color': '#0b2342',
          'circle-stroke-width': 2,
        },
      });

      const popup = new maplibregl.Popup({ closeButton: false });
      map.on('mouseenter', 'survey', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        popup
          .setLngLat(e.features[0].geometry.coordinates)
          .setText('Survey point ' + e.features[0].properties.label)
          .addTo(map);
      });
      map.on('mouseleave', 'survey', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });
    });

    return () => map.remove();
  }, [data]);

  return <div ref={container} style={{ width: '100%', height: '100%' }} />;
}

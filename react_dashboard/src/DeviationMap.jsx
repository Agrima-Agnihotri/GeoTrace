import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const HOME = { center: [75.87003, 26.4002], zoom: 19, pitch: 60, bearing: -25 };

const style = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      // Soft, pastel-looking base map.
      paint: { 'raster-saturation': -0.35, 'raster-brightness-min': 0.12, 'raster-opacity': 0.95 },
    },
  ],
};

const kind = (k) => ['==', ['get', 'kind'], k];

const LAYER_GROUPS = {
  planned: ['planned'],
  actual: ['actual'],
  deviation: ['deviation'],
  survey: ['survey'],
  depth: ['depth-planned', 'depth-actual'],
};

function applyVisibility(map, visible) {
  Object.entries(LAYER_GROUPS).forEach(([key, ids]) => {
    ids.forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', visible[key] ? 'visible' : 'none');
      }
    });
  });
}

export default function DeviationMap({ data, depthBars, visible, is3d, resetToken }) {
  const container = useRef(null);
  const mapRef = useRef(null);
  const loaded = useRef(false);
  const latest = useRef({ visible, is3d });
  latest.current = { visible, is3d };

  useEffect(() => {
    const map = new maplibregl.Map({
      container: container.current,
      style,
      center: HOME.center,
      zoom: HOME.zoom,
      pitch: HOME.pitch,
      bearing: HOME.bearing,
      maxPitch: 75,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    // Keep the map correct when only its container changes size (split view).
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current);

    map.on('load', () => {
      map.addSource('route', { type: 'geojson', data });
      map.addSource('depth', { type: 'geojson', data: depthBars });

      // 3D depth bars (height = depth in metres, visual aid).
      map.addLayer({
        id: 'depth-planned',
        type: 'fill-extrusion',
        source: 'depth',
        filter: kind('planned'),
        paint: {
          'fill-extrusion-color': '#8fd8e8',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-opacity': 0.5,
        },
      });
      map.addLayer({
        id: 'depth-actual',
        type: 'fill-extrusion',
        source: 'depth',
        filter: kind('actual'),
        paint: {
          'fill-extrusion-color': '#7aa8f5',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-opacity': 0.75,
        },
      });

      map.addLayer({
        id: 'planned',
        type: 'line',
        source: 'route',
        filter: kind('planned'),
        paint: { 'line-color': '#1fa5c4', 'line-width': 4, 'line-dasharray': [2, 2] },
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
        paint: { 'line-color': '#ef4444', 'line-width': 6, 'line-opacity': 0.9 },
      });
      map.addLayer({
        id: 'survey',
        type: 'circle',
        source: 'route',
        filter: kind('survey'),
        paint: {
          'circle-radius': 7,
          'circle-color': '#fb923c',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2.5,
          'circle-pitch-alignment': 'map',
        },
      });

      const popup = new maplibregl.Popup({ closeButton: false, offset: 12 });
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
      map.on('mouseenter', 'deviation', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        popup.setLngLat(e.lngLat).setText('Deviation from the planned route').addTo(map);
      });
      map.on('mouseleave', 'deviation', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });

      loaded.current = true;
      applyVisibility(map, latest.current.visible);
    });

    return () => {
      observer.disconnect();
      loaded.current = false;
      map.remove();
    };
  }, [data, depthBars]);

  useEffect(() => {
    if (loaded.current && mapRef.current) applyVisibility(mapRef.current, visible);
  }, [visible]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.easeTo({
      pitch: is3d ? HOME.pitch : 0,
      bearing: is3d ? HOME.bearing : 0,
      duration: 700,
    });
  }, [is3d]);

  useEffect(() => {
    if (resetToken === 0 || !mapRef.current) return;
    mapRef.current.flyTo({
      center: HOME.center,
      zoom: HOME.zoom,
      pitch: latest.current.is3d ? HOME.pitch : 0,
      bearing: latest.current.is3d ? HOME.bearing : 0,
      duration: 900,
    });
  }, [resetToken]);

  return <div ref={container} className="map" />;
}

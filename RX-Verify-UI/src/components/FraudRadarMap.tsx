import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getHeatmapData } from '../services/flags';
import type { HeatmapPoint } from '../services/flags';
import { Loader2, AlertOctagon } from 'lucide-react';

const FraudRadarMap: React.FC = () => {
  const [points, setPoints] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const data = await getHeatmapData();
        setPoints(data);
      } catch (err) {
        console.error('Failed to load heatmap data', err);
        setError('Unable to load radar data');
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmap();
    // Refresh every 30 seconds for "live" tracking feel
    const interval = setInterval(fetchHeatmap, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-96 bg-[#0a0e1a]/80 backdrop-blur-md rounded-2xl border border-gray-800 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 bg-[#0a0e1a]/80 backdrop-blur-md rounded-2xl border border-red-900/50 flex flex-col items-center justify-center text-red-400">
        <AlertOctagon className="w-10 h-10 mb-3 opacity-50" />
        <p className="font-bold">{error}</p>
        <p className="text-sm opacity-70">Check connection or server status</p>
      </div>
    );
  }

  // Determine marker styles based on severity
  const getMarkerOptions = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return { color: '#D50000', fillColor: '#D50000', fillOpacity: 0.7, radius: 12 };
      case 'HIGH':
        return { color: '#FF3D00', fillColor: '#FF3D00', fillOpacity: 0.6, radius: 10 };
      case 'MEDIUM':
        return { color: '#FFD60A', fillColor: '#FFD60A', fillOpacity: 0.5, radius: 8 };
      default:
        return { color: '#00C853', fillColor: '#00C853', fillOpacity: 0.4, radius: 6 };
    }
  };

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-gray-800 shadow-2xl relative">
      {/* 
        Custom CSS for Dark Mode Maps 
        We use an invert filter to turn standard OpenStreetMap tiles into a dark theme. 
        Note: The hue-rotate helps maintain some color balance, preventing it from being entirely grayscale negative.
      */}
      <style>
        {`
          .leaflet-layer,
          .leaflet-control-zoom-in,
          .leaflet-control-zoom-out,
          .leaflet-control-attribution {
            filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
          }
          .leaflet-container {
            background-color: #0a0e1a;
          }
          .leaflet-popup-content-wrapper {
            background-color: #151923;
            color: white;
            border: 1px solid #374151;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
          }
          .leaflet-popup-tip {
            background-color: #151923;
            border: 1px solid #374151;
          }
        `}
      </style>

      {/* Center on Kenya */}
      <MapContainer 
        center={[0.0236, 37.9062]} 
        zoom={6} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((point) => (
          <CircleMarker
            key={point.id}
            center={[point.latitude, point.longitude]}
            pathOptions={getMarkerOptions(point.severity)}
          >
            <Popup className="custom-popup">
              <div className="font-display">
                <div className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-2">
                  <AlertOctagon className={`w-4 h-4 ${point.severity === 'CRITICAL' ? 'text-red-500' : 'text-yellow-500'}`} />
                  <span className="font-bold text-sm tracking-wide">
                    {point.severity === 'CRITICAL' ? 'CRITICAL ALERT' : `WARNING: ${point.severity}`}
                  </span>
                </div>
                <p className="font-bold text-white text-md mb-1">{point.medicine_name}</p>
                <p className="text-gray-400 text-xs">Flagged at Coordinates:</p>
                <p className="text-gray-500 text-[10px] font-mono">{point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      {/* Overlay Status Badge */}
      <div className="absolute top-4 right-4 z-[400] bg-[#151923]/90 backdrop-blur border border-gray-700 rounded-xl px-4 py-2 flex items-center gap-3 shadow-lg">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </div>
        <div>
          <p className="text-white text-xs font-bold font-mono">LIVE RADAR</p>
          <p className="text-gray-400 text-[10px]">Tracking {points.length} nodes</p>
        </div>
      </div>
    </div>
  );
};

export default FraudRadarMap;

/**
 * VehicleTracking — Command & Control Center
 * Enterprise-grade real-time vehicle surveillance dashboard.
 * 3-panel layout: Fleet sidebar | Full-screen animated map | Vehicle detail panel
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Truck, Navigation, Clock, Wifi, WifiOff, Map as MapIcon,
  AlertTriangle, Bell, Shield, Activity, Gauge, TrendingUp,
  TrendingDown, CheckCircle, XCircle, ChevronRight, Radio,
  Fuel, MapPin, BarChart2, Eye, Zap, Timer, Award, Brain,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { Map, MapMarker, MarkerContent, MapControls } from '@/components/ui/map';
import BehaviorScore from '@/components/tracking/BehaviorScore';
import AlertBanner from '@/components/tracking/AlertBanner';
import api from '@/config/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  Active:      '#4ADE80',
  Delayed:     '#FBBF24',
  Offline:     '#F87171',
  Maintenance: '#C084FC',
};

const STATUS_BG = {
  Active:      'rgba(74,222,128,0.12)',
  Delayed:     'rgba(251,191,36,0.12)',
  Offline:     'rgba(248,113,113,0.12)',
  Maintenance: 'rgba(192,132,252,0.12)',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Top command bar with live stats */
function CommandBar({ vehicles, connected, alerts, currentTime }) {
  const active = vehicles.filter(v => v.status === 'Active').length;
  const delayed = vehicles.filter(v => v.status === 'Delayed').length;
  const offline = vehicles.filter(v => v.status === 'Offline').length;
  const onRoute = vehicles.filter(v => v.on_route !== false).length;
  const avgScore = vehicles.length
    ? Math.round(vehicles.reduce((s, v) => s + (v.behavior_score || 85), 0) / vehicles.length)
    : 0;

  return (
    <div
  className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
  style={{ background: 'var(--header-bg)', borderBottomColor: 'var(--border)', backdropFilter: 'blur(12px)', color: 'var(--foreground)' }}
>
  {/* Left — title */}
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
        <Radio size={16} className="text-blue-400" />
      </div>
      <div>
        <h2 className="text-sm font-black tracking-wide leading-tight" style={{ color: 'var(--foreground)' }}>
          Command & Control Center
        </h2>
        <p className="text-[0.62rem] leading-none" style={{ color: 'var(--muted-foreground)' }}>
              Swachh Surveillance · Andhra Pradesh
            </p>
          </div>
        </div>
      </div>

      {/* Center — fleet stats */}
      <div className="hidden lg:flex items-center gap-1">
        {[
          { label: 'Active', value: active, color: '#4ADE80', icon: CheckCircle },
          { label: 'Delayed', value: delayed, color: '#FBBF24', icon: Timer },
          { label: 'Offline', value: offline, color: '#F87171', icon: XCircle },
          { label: 'On Route', value: `${onRoute}/${vehicles.length}`, color: '#60A5FA', icon: Navigation },
          { label: 'Avg Score', value: avgScore, color: avgScore >= 80 ? '#4ADE80' : avgScore >= 60 ? '#FBBF24' : '#F87171', icon: Award },
        ].map(({ label, value, color, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
            style={{ background: color + '10', borderColor: color + '25' }}
          >
            <Icon size={11} style={{ color }} />
            <span className="text-[0.68rem] font-black" style={{ color }}>{value}</span>
            <span className="text-[0.62rem]" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Right — connection + time + alerts */}
      <div className="flex items-center gap-3">
        {alerts.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/25">
            <Bell size={11} className="text-red-400 animate-pulse" />
            <span className="text-[0.68rem] font-black text-red-400">{alerts.length} Alert{alerts.length > 1 ? 's' : ''}</span>
          </div>
        )}
        <div className={`flex items-center gap-1.5 text-[0.72rem] font-semibold ${connected ? 'text-green-400' : 'text-red-400'}`}>
          {connected
            ? <><Wifi size={12} className="animate-pulse" /> LIVE</>
            : <><WifiOff size={12} /> OFFLINE</>
          }
        </div>
        <div className="text-[0.68rem] font-mono" style={{ color: 'var(--muted-foreground)' }}>{currentTime}</div>
      </div>
    </div>
  );
}

/** Left panel — fleet list */
function FleetPanel({ vehicles, selected, onSelect }) {
  const [filter, setFilter] = useState('all');

  const filtered = vehicles.filter(v => {
    if (filter === 'all') return true;
    if (filter === 'active') return v.status === 'Active';
    if (filter === 'alert') return v.on_route === false || v.speed > 40;
    return true;
  });

  return (
    <div
  className="w-72 flex-shrink-0 flex flex-col border-r overflow-hidden"
  style={{ background: 'var(--card)', borderRightColor: 'var(--border)', color: 'var(--foreground)' }}
>
  {/* Panel header */}
  <div className="px-4 pt-4 pb-3 border-b" style={{ borderBottomColor: 'var(--border)' }}>
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[0.8rem] font-black tracking-wide" style={{ color: 'var(--foreground)' }}>Layout Registry</h3>
      <span className="text-[0.6rem] px-2 py-0.5 rounded-full" style={{ background: 'var(--sidebar-card-bg)', color: 'var(--muted-foreground)' }}>
            {vehicles.length} units
          </span>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'alert', label: '⚠ Alerts' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 text-[0.62rem] font-bold py-1 rounded-md transition-all ${
                filter === tab.key
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 hover:text-gray-400 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filtered.map(v => {
          const color = STATUS_COLOR[v.status] || '#9CA3AF';
          const isAlert = v.on_route === false || v.speed > 40;
          const score = v.behavior_score || 85;
          const scoreColor = score >= 80 ? '#4ADE80' : score >= 60 ? '#FBBF24' : '#F87171';

          return (
            <button
              key={v.id}
              onClick={() => onSelect(v)}
              className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                selected?.id === v.id
                  ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_16px_rgba(59,130,246,0.12)]'
                  : isAlert
                  ? 'border-red-500/25 bg-red-500/5 hover:border-red-500/40'
                  : 'hover:border-border hover:bg-muted'
              }`}
              style={selected?.id !== v.id && !isAlert ? { borderColor: 'var(--border)', backgroundColor: 'var(--card)' } : {}}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Status dot + truck icon */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                    style={{ background: STATUS_BG[v.status], border: `1px solid ${color}30` }}
                  >
                    🚛
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-[0.78rem] truncate" style={{ color: 'var(--foreground)' }}>{v.vehicle_number}</div>
                    <div className="text-[0.65rem] truncate" style={{ color: 'var(--muted-foreground)' }}>{v.driver_name}</div>
                  </div>
                </div>
                {/* Mini score */}
                <div className="flex flex-col items-end flex-shrink-0">
                  <div
                    className="text-[0.72rem] font-black"
                    style={{ color }}
                  >
                    {v.status}
                  </div>
                  <div className="text-[0.62rem]" style={{ color: scoreColor }}>
                    ★ {Math.round(score)}
                  </div>
                </div>
              </div>

              {/* Speed + compliance row */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 text-[0.65rem]" style={{ color: 'var(--muted-foreground)' }}>
                  <Gauge size={9} />
                  <span className={v.speed > 40 ? 'text-red-400 font-bold' : ''}>
                    {(v.speed || 0).toFixed(1)} km/h
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[0.65rem]">
                  {v.on_route === false
                    ? <span className="text-orange-400 flex items-center gap-0.5"><XCircle size={9} /> Off-Route</span>
                    : <span className="text-green-400 flex items-center gap-0.5"><CheckCircle size={9} /> On-Route</span>
                  }
                </div>
                <div className="flex items-center gap-1 text-[0.65rem] ml-auto" style={{ color: 'var(--muted-foreground)' }}>
                  <Fuel size={9} />
                  {v.fuel_level || 0}%
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Animated vehicle marker for MapLibre */
function AnimatedVehicleMarker({ vehicle, isSelected, onClick }) {
  const color = STATUS_COLOR[vehicle.status] || '#9CA3AF';
  const heading = vehicle.heading || 0;
  const isAlert = vehicle.on_route === false || vehicle.speed > 40;

  return (
    <MapMarker
      longitude={vehicle.lng}
      latitude={vehicle.lat}
      onClick={onClick}
    >
      <MarkerContent>
        <div className="relative cursor-pointer" style={{ transform: `rotate(${heading}deg)` }}>
          {/* Active pulse ring */}
          {vehicle.status === 'Active' && !isAlert && (
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                background: color + '30',
                transform: 'scale(2)',
                animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
              }}
            />
          )}
          {/* Alert pulse ring */}
          {isAlert && (
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'rgba(239,68,68,0.3)',
                transform: 'scale(2)',
                animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite',
              }}
            />
          )}
          {/* Main marker */}
          <div
            className="relative w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg text-sm"
            style={{
              background: isAlert ? '#EF4444' : STATUS_BG[vehicle.status] || '#1F2937',
              borderColor: isAlert ? '#EF4444' : color,
              boxShadow: `0 0 ${isSelected ? 16 : 8}px ${color}60`,
            }}
          >
            🚛
          </div>
          {/* Direction arrow */}
          {vehicle.speed > 2 && (
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '3px solid transparent',
                borderRight: '3px solid transparent',
                borderBottom: `6px solid ${color}`,
              }}
            />
          )}
        </div>
      </MarkerContent>
    </MapMarker>
  );
}

/** Route trail layer using MapLibre GL source/layer */
function RouteTrail({ mapRef, vehicle }) {
  useEffect(() => {
    const map = mapRef?.current;
    if (!map || !vehicle?.route_history?.length) return;

    const sourceId = `trail-source-${vehicle.id}`;
    const layerId = `trail-layer-${vehicle.id}`;

    const coords = vehicle.route_history
      .slice(-20)
      .map(p => [p.lng, p.lat])
      .filter(([lng, lat]) => lng && lat);

    if (coords.length < 2) return;

    const geojson = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
    };

    try {
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(geojson);
      } else {
        map.addSource(sourceId, { type: 'geojson', data: geojson });
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': STATUS_COLOR[vehicle.status] || '#60A5FA',
            'line-width': 2.5,
            'line-opacity': 0.6,
            'line-dasharray': [2, 3],
          },
        });
      }
    } catch (e) {
      // Map not ready yet — ignore
    }

    return () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch (e) {}
    };
  }, [mapRef, vehicle?.id, vehicle?.route_history?.length, vehicle?.status]);

  return null;
}

/** Optimized route layer using MapLibre GL source/layer */
function OptimizedRoute({ mapRef, vehicle, optimizedWaypoints }) {
  useEffect(() => {
    const map = mapRef?.current;
    if (!map || !optimizedWaypoints?.length) return;

    const sourceId = `opt-route-source-${vehicle.id}`;
    const layerId = `opt-route-layer-${vehicle.id}`;

    const coords = optimizedWaypoints.map(p => [p.lng, p.lat]);

    if (coords.length < 2) return;

    const geojson = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
    };

    try {
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(geojson);
      } else {
        map.addSource(sourceId, { type: 'geojson', data: geojson });
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#10B981', // Green for optimized
            'line-width': 4,
            'line-opacity': 0.8,
            'line-dasharray': [1, 2],
          },
        });
      }
    } catch (e) {}

    return () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch (e) {}
    };
  }, [mapRef, vehicle?.id, optimizedWaypoints]);

  return null;
}

/** Right detail panel for selected vehicle */
function VehicleDetailPanel({ vehicle, onClose, onOptimize, isOptimizing }) {
  if (!vehicle) return null;

  const color = STATUS_COLOR[vehicle.status] || '#9CA3AF';
  const score = vehicle.behavior_score || 85;
  const history = (vehicle.route_history || []).slice(-8).reverse();

  return (
    <div
  className="w-72 flex-shrink-0 flex flex-col border-l overflow-y-auto"
  style={{ background: 'var(--card)', borderLeftColor: 'var(--border)', color: 'var(--foreground)' }}
>
  {/* Header */}
  <div className="px-4 pt-4 pb-3 border-b" style={{ borderBottomColor: 'var(--border)' }}>
    <div className="flex items-start justify-between">
      <div>
        <div
          className="text-[0.6rem] font-black uppercase tracking-widest mb-1"
          style={{ color }}
        >
          {vehicle.status} · Ward {vehicle.ward_id || '?'}
        </div>
        <h3 className="text-base font-black leading-tight" style={{ color: 'var(--foreground)' }}>{vehicle.vehicle_name}</h3>
        <p className="text-[0.72rem] font-mono" style={{ color: 'var(--muted-foreground)' }}>{vehicle.vehicle_number}</p>
      </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-400 transition-colors mt-1"
          >
            <XCircle size={16} />
          </button>
        </div>
      </div>

      {/* Behavior Score ring */}
      <div className="py-5 flex justify-center border-b" style={{ borderBottomColor: 'var(--border)' }}>
        <BehaviorScore score={score} size={110} />
      </div>

      {/* Driver info grid */}
      <div className="p-4 border-b" style={{ borderBottomColor: 'var(--border)' }}>
        <div className="text-[0.6rem] uppercase tracking-widest mb-3 font-bold" style={{ color: 'var(--muted-foreground)' }}>Driver Info</div>
        <div className="space-y-2">
          {[
            ['Driver', vehicle.driver_name],
            ['Phone', vehicle.driver_phone || '—'],
            ['Speed', `${(vehicle.speed || 0).toFixed(1)} km/h`],
            ['Fuel', `${vehicle.fuel_level || 0}%`],
            ['ETA', vehicle.eta || 'N/A'],
          ].map(([k, val]) => (
            <div key={k} className="flex justify-between items-center">
              <span className="text-[0.68rem]" style={{ color: 'var(--muted-foreground)' }}>{k}</span>
              <span
                className={`text-[0.72rem] font-bold`}
                style={{
                  color: k === 'Speed' && (vehicle.speed || 0) > 40
                    ? '#F87171'
                    : 'var(--foreground)'
                }}
              >
                {val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance status */}
      <div className="p-4 border-b" style={{ borderBottomColor: 'var(--border)' }}>
        <div className="text-[0.6rem] uppercase tracking-widest mb-3 font-bold" style={{ color: 'var(--muted-foreground)' }}>Compliance Status</div>
        <div
          className="flex items-center gap-2.5 p-3 rounded-xl border"
          style={{
            background: vehicle.on_route !== false ? 'rgba(74,222,128,0.08)' : 'rgba(249,115,22,0.08)',
            borderColor: vehicle.on_route !== false ? 'rgba(74,222,128,0.25)' : 'rgba(249,115,22,0.25)',
          }}
        >
          {vehicle.on_route !== false
            ? <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
            : <XCircle size={20} className="text-orange-400 flex-shrink-0" />
          }
          <div>
            <div className={`text-[0.78rem] font-black ${vehicle.on_route !== false ? 'text-green-400' : 'text-orange-400'}`}>
              {vehicle.on_route !== false ? 'On Assigned Route' : 'Deviation Detected'}
            </div>
            <div className="text-[0.62rem] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {vehicle.street_name || 'Route data updating...'}
            </div>
          </div>
        </div>
      </div>

      {/* AI Route Optimization */}
      <div className="p-4 border-b" style={{ borderBottomColor: 'var(--border)' }}>
        <button
          onClick={() => onOptimize(vehicle.id)}
          disabled={isOptimizing}
          className="w-full flex justify-center items-center gap-2 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors font-bold text-xs"
        >
          {isOptimizing ? <Activity size={14} className="animate-spin" /> : <Brain size={14} />}
          {isOptimizing ? 'Optimizing Route...' : 'AI Optimize Route'}
        </button>
      </div>

      {/* Route history timeline */}
      <div className="p-4">
        <div className="text-[0.6rem] uppercase tracking-widest mb-3 font-bold" style={{ color: 'var(--muted-foreground)' }}>
          GPS History ({history.length} pts)
        </div>
        <div className="space-y-1.5">
          {history.map((pt, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pt.on_route !== false ? 'bg-green-500' : 'bg-orange-500'}`} />
              <div className="text-[0.62rem] font-mono" style={{ color: 'var(--muted-foreground)' }}>
                {pt.lat?.toFixed(4)}, {pt.lng?.toFixed(4)}
              </div>
              {pt.speed !== undefined && (
                <div className="text-[0.6rem] ml-auto" style={{ color: 'var(--muted-foreground)' }}>{pt.speed?.toFixed(0)} km/h</div>
              )}
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-[0.68rem]" style={{ color: 'var(--muted-foreground)' }}>No history yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VehicleTracking() {
  const [selected, setSelected] = useState(null);
  const [currentTime, setCurrentTime] = useState('');
  const [mapTheme, setMapTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const mapRef = useRef(null);
  const { vehicles = [], wsConnected: connected = false, alerts = [], dismissAlert } = useOutletContext() || {};

  const handleOptimizeRoute = async (vehicleId) => {
    setIsOptimizing(true);
    try {
      const res = await api.get(`/api/vehicles/${vehicleId}/optimize-route`);
      if (res.data && res.data.optimized_waypoints) {
        setOptimizedRoute(res.data.optimized_waypoints);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Update clock every second
  useEffect(() => {
    const tick = () => setCurrentTime(format(new Date(), 'HH:mm:ss'));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Sync map theme with global theme changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTheme = localStorage.getItem('theme') || 'dark';
      if (currentTheme !== mapTheme) {
        setMapTheme(currentTheme);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [mapTheme]);

  // Keep selected vehicle data in sync with live updates
  useEffect(() => {
    if (selected) {
      const updated = vehicles.find(v => v.id === selected.id);
      if (updated) setSelected(updated);
    }
  }, [vehicles]);

  const handleVehicleSelect = useCallback((v) => {
    setSelected(prev => prev?.id === v.id ? null : v);
    setOptimizedRoute(null);
    if (v && v.lng && v.lat && mapRef.current) {
      try {
        mapRef.current.flyTo({
          center: [v.lng, v.lat],
          zoom: 14,
          essential: true
        });
      } catch (err) {
        console.error("Map flyTo error:", err);
      }
    }
  }, []);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)', margin: '-1.5rem', overflow: 'hidden' }}>
      {/* Command bar */}
      <CommandBar
        vehicles={vehicles}
        connected={connected}
        alerts={alerts}
        currentTime={currentTime}
      />

      {/* Main content: 3-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left fleet panel */}
        <FleetPanel
          vehicles={vehicles}
          selected={selected}
          onSelect={handleVehicleSelect}
        />

        {/* Center map */}
        <div className="flex-1 relative bg-background" style={{ backgroundColor: 'var(--background)' }}>
          <Map
            viewport={{ center: [80.6280, 16.5150], zoom: 13 }}
            theme={mapTheme}
            ref={mapRef}
          >
            <MapControls position="top-right" showLocate showCompass />

            {/* Vehicle markers */}
            {vehicles.filter(v => v.lat && v.lng).map(v => (
              <AnimatedVehicleMarker
                key={v.id}
                vehicle={v}
                isSelected={selected?.id === v.id}
                onClick={() => handleVehicleSelect(v)}
              />
            ))}

            {/* Route trails for selected vehicle */}
            {selected && (
              <RouteTrail mapRef={mapRef} vehicle={selected} />
            )}

            {/* Optimized Route */}
            {selected && optimizedRoute && (
              <OptimizedRoute mapRef={mapRef} vehicle={selected} optimizedWaypoints={optimizedRoute} />
            )}
          </Map>

          {/* Map overlay — bottom info bar */}
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full border text-[0.65rem]"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', backdropFilter: 'blur(10px)' }}
          >
            <span className="flex items-center gap-1"><Navigation size={10} /> Vijayawada–Amaravati Region, AP</span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span className="flex items-center gap-1"><Activity size={10} className="text-green-400" /> GPS Simulator Active</span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span style={{ color: 'var(--foreground)' }}>{vehicles.filter(v => v.on_route !== false).length}/{vehicles.length} on route</span>
          </div>
        </div>

        {/* Right detail panel */}
        {selected && (
          <VehicleDetailPanel
            vehicle={selected}
            onClose={() => setSelected(null)}
            onOptimize={handleOptimizeRoute}
            isOptimizing={isOptimizing}
          />
        )}
      </div>

      {/* Alert banners (portal-style, fixed bottom-right) */}
      <AlertBanner alerts={alerts} onDismiss={dismissAlert} />
    </div>
  );
}

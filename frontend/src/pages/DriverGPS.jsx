/**
 * DriverGPS — Mobile-optimized driver interface for live GPS broadcasting.
 * Drivers open this page on their phone, select their vehicle, and press
 * "Start Tracking" to continuously share their GPS with the control center.
 *
 * Uses navigator.geolocation.watchPosition() for continuous tracking.
 * POSTs to /api/vehicles/{id}/gps every 5 seconds.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Locate, CheckCircle, XCircle, Radio, Pause, Play, ArrowLeft, Gauge, Navigation } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;

const VEHICLES_MOCK = [
  { id: 1, vehicle_number: 'AP16-TJ-2001', vehicle_name: 'Waste Truck 1' },
  { id: 2, vehicle_number: 'AP16-TJ-2002', vehicle_name: 'Waste Truck 2' },
  { id: 3, vehicle_number: 'AP16-TJ-2003', vehicle_name: 'Waste Truck 3' },
  { id: 4, vehicle_number: 'AP16-TJ-2004', vehicle_name: 'Waste Truck 4' },
  { id: 5, vehicle_number: 'AP16-TJ-2005', vehicle_name: 'Waste Truck 5' },
  { id: 6, vehicle_number: 'AP16-TJ-2006', vehicle_name: 'Waste Truck 6' },
];

export default function DriverGPS() {
  const [vehicles, setVehicles] = useState(VEHICLES_MOCK);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [currentPos, setCurrentPos] = useState(null);
  const [lastBroadcast, setLastBroadcast] = useState(null);
  const [broadcastCount, setBroadcastCount] = useState(0);
  const [error, setError] = useState('');
  const [onRoute, setOnRoute] = useState(null);
  const [behaviorScore, setBehaviorScore] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [speed, setSpeed] = useState(0);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehNum, setNewVehNum] = useState('');
  const [newVehName, setNewVehName] = useState('');
  const [newDriverName, setNewDriverName] = useState('');

  // Simulation Center Coordinates State
  const [simLat, setSimLat] = useState('16.5150');
  const [simLng, setSimLng] = useState('80.5150');

  const watchIdRef = useRef(null);
  const broadcastIntervalRef = useRef(null);
  const latestPosRef = useRef(null);
  const simIntervalRef = useRef(null);
  const simAngleRef = useRef(0);

  // Fetch vehicle list from API
  useEffect(() => {
    fetch(`${API}/api/vehicles/public`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.length > 0) setVehicles(data);
      })
      .catch(() => {}); // fallback to mock
  }, []);

  const handleRegisterVehicle = async (e) => {
    e.preventDefault();
    if (!newVehNum || !newVehName || !newDriverName) {
      setError('Please fill in all registration fields');
      return;
    }
    setError('');
    try {
      const res = await fetch(`${API}/api/vehicles/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_number: newVehNum.trim(),
          vehicle_name: newVehName.trim(),
          driver_name: newDriverName.trim(),
          ward_id: 1,
        }),
      });
      if (res.ok) {
        const newVehicle = await res.json();
        setVehicles(prev => {
          const exists = prev.some(v => v.id === newVehicle.id);
          if (exists) return prev;
          return [...prev, newVehicle];
        });
        setSelectedVehicleId(String(newVehicle.id));
        setShowAddForm(false);
        setNewVehNum('');
        setNewVehName('');
        setNewDriverName('');
      } else {
        setError('Failed to register custom vehicle');
      }
    } catch (err) {
      setError('Connection error registering vehicle');
    }
  };

  const broadcastGPS = useCallback(async (pos) => {
    if (!selectedVehicleId || !pos) return;
    const payload = {
      lat: pos.lat,
      lng: pos.lng,
      speed: pos.speed || 0,
      accuracy: pos.accuracy,
      heading: pos.heading || null,
    };
    try {
      const res = await fetch(`${API}/api/vehicles/${selectedVehicleId}/gps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setLastBroadcast(new Date().toLocaleTimeString());
        setBroadcastCount(c => c + 1);
        setOnRoute(data.on_route);
        setBehaviorScore(data.behavior_score);
        setError('');
      }
    } catch (e) {
      setError('Network error — will retry');
    }
  }, [selectedVehicleId]);

  const startTracking = useCallback(() => {
    if (!selectedVehicleId) {
      setError('Please select your vehicle first');
      return;
    }
    setError('');
    setIsTracking(true);

    if (isSimulated) {
      // Simulate circular path movement around base coords
      const baseLat = parseFloat(simLat) || 16.5150;
      const baseLng = parseFloat(simLng) || 80.5150;
      simAngleRef.current = 0;

      const tickSimulation = () => {
        simAngleRef.current += 0.05; // Speed of circular trajectory
        const radius = 0.005; // radius of travel
        const newLat = baseLat + Math.sin(simAngleRef.current) * radius;
        const newLng = baseLng + Math.cos(simAngleRef.current) * radius;
        const newHeading = (simAngleRef.current * 180 / Math.PI + 90) % 360;

        const pos = {
          lat: newLat,
          lng: newLng,
          accuracy: 5,
          speed: 25,
          heading: newHeading,
        };
        latestPosRef.current = pos;
        setCurrentPos(pos);
        setAccuracy(5);
        setSpeed(25);
        broadcastGPS(pos);
      };

      tickSimulation();
      simIntervalRef.current = setInterval(tickSimulation, 3000);
    } else {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this browser');
        setIsTracking(false);
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: (position.coords.speed || 0) * 3.6, // m/s → km/h
            heading: position.coords.heading,
          };
          latestPosRef.current = pos;
          setCurrentPos(pos);
          setAccuracy(Math.round(position.coords.accuracy));
          setSpeed(Math.round((position.coords.speed || 0) * 3.6));
        },
        (err) => {
          setError(`GPS Error: ${err.message}`);
          setIsTracking(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // Broadcast every 5 seconds
      broadcastIntervalRef.current = setInterval(() => {
        if (latestPosRef.current) broadcastGPS(latestPosRef.current);
      }, 5000);

      // Broadcast immediately
      if (latestPosRef.current) broadcastGPS(latestPosRef.current);
    }
  }, [selectedVehicleId, isSimulated, simLat, simLng, broadcastGPS]);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (broadcastIntervalRef.current) {
      clearInterval(broadcastIntervalRef.current);
      broadcastIntervalRef.current = null;
    }
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setCurrentPos(null);
    latestPosRef.current = null;
  }, []);

  useEffect(() => () => stopTracking(), []);

  const selectedVehicle = vehicles.find(v => String(v.id) === String(selectedVehicleId));

  return (
    <div
      className="min-h-screen font-sans text-gray-200"
      style={{ background: 'linear-gradient(160deg, #030810 0%, #070D1A 50%, #030810 100%)' }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/8 px-5 py-4 flex items-center justify-between"
        style={{ background: 'rgba(6,12,20,0.92)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-gray-600 hover:text-gray-400 transition-colors">
            <ArrowLeft size={18} />
          </a>
          <div>
            <h1 className="text-base font-black text-white leading-tight">Driver GPS Console</h1>
            <p className="text-[0.65rem] text-green-400 font-semibold tracking-wider uppercase">
              Swachh Surveillance · AP
            </p>
          </div>
        </div>
        {isTracking && (
          <div className="flex items-center gap-1.5 text-[0.72rem] font-bold text-green-400">
            <Radio size={13} className="animate-pulse" />
            BROADCASTING
          </div>
        )}
      </header>

      <main className="max-w-sm mx-auto px-5 py-8 space-y-5">

        {/* Vehicle selector */}
        <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
          <label className="block text-[0.65rem] font-black text-gray-500 uppercase tracking-widest mb-3">
            Select Your Vehicle
          </label>
          <select
            value={selectedVehicleId}
            onChange={e => setSelectedVehicleId(e.target.value)}
            disabled={isTracking}
            className="w-full bg-white/6 border border-white/12 rounded-xl p-3.5 text-white font-bold text-sm outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            style={{ background: '#0B1220' }}
          >
            <option value="">— Choose vehicle —</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.vehicle_number} · {v.vehicle_name}</option>
            ))}
          </select>
          {selectedVehicle && (
            <div className="mt-3 flex items-center gap-2 text-[0.72rem] text-gray-400">
              <CheckCircle size={13} className="text-green-400" />
              Assigned to: <span className="text-white font-semibold">{selectedVehicle.driver_name || 'You'}</span>
            </div>
          )}
          {!isTracking && (
            <button
              type="button"
              onClick={() => setShowAddForm(f => !f)}
              className="mt-3.5 text-[0.68rem] text-blue-400 font-bold hover:underline bg-transparent border-none outline-none cursor-pointer block p-0"
            >
              {showAddForm ? '✕ Close Registration' : '+ Register custom vehicle for testing'}
            </button>
          )}
        </div>

        {showAddForm && !isTracking && (
          <form onSubmit={handleRegisterVehicle} className="bg-white/4 border border-white/10 rounded-2xl p-5 space-y-3.5">
            <h3 className="text-[0.68rem] font-black text-white uppercase tracking-wider">Register Test Vehicle</h3>
            <div>
              <label className="block text-[0.62rem] text-gray-500 uppercase font-black mb-1.5">Vehicle Number</label>
              <input
                type="text"
                placeholder="e.g. AP16-TJ-TEST"
                value={newVehNum}
                onChange={e => setNewVehNum(e.target.value)}
                required
                className="w-full bg-white/6 border border-white/12 rounded-xl p-2.5 text-white text-xs outline-none focus:border-blue-500 transition-colors"
                style={{ background: '#0B1220' }}
              />
            </div>
            <div>
              <label className="block text-[0.62rem] text-gray-500 uppercase font-black mb-1.5">Vehicle Name / Type</label>
              <input
                type="text"
                placeholder="e.g. Test Garbage Loader"
                value={newVehName}
                onChange={e => setNewVehName(e.target.value)}
                required
                className="w-full bg-white/6 border border-white/12 rounded-xl p-2.5 text-white text-xs outline-none focus:border-blue-500 transition-colors"
                style={{ background: '#0B1220' }}
              />
            </div>
            <div>
              <label className="block text-[0.62rem] text-gray-500 uppercase font-black mb-1.5">Driver Name</label>
              <input
                type="text"
                placeholder="e.g. Self / Tester"
                value={newDriverName}
                onChange={e => setNewDriverName(e.target.value)}
                required
                className="w-full bg-white/6 border border-white/12 rounded-xl p-2.5 text-white text-xs outline-none focus:border-blue-500 transition-colors"
                style={{ background: '#0B1220' }}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow border-none cursor-pointer"
            >
              Register & Select Vehicle
            </button>
          </form>
        )}

        {/* Simulation mode toggle */}
        <div className="bg-white/4 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="block text-sm font-bold text-white">Simulate GPS Movement</span>
            <span className="block text-[0.65rem] text-gray-500 mt-0.5">Mock driving on desktop browser</span>
          </div>
          <button
            onClick={() => setIsSimulated(s => !s)}
            disabled={isTracking}
            className={`w-12 h-6 rounded-full p-0.5 transition-colors relative outline-none border-none cursor-pointer ${
              isSimulated ? 'bg-blue-500' : 'bg-gray-700'
            } disabled:opacity-50`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform transform ${
                isSimulated ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {isSimulated && !isTracking && (
          <div className="bg-white/4 border border-white/10 rounded-2xl p-5 space-y-3 animate-fadeIn">
            <span className="block text-xs font-black text-white uppercase tracking-wider">Simulation Center</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.6rem] text-gray-500 uppercase font-bold mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={simLat}
                  onChange={e => setSimLat(e.target.value)}
                  className="w-full bg-[#0B1220] border border-white/12 rounded-xl p-2 text-white text-xs outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[0.6rem] text-gray-500 uppercase font-bold mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={simLng}
                  onChange={e => setSimLng(e.target.value)}
                  className="w-full bg-[#0B1220] border border-white/12 rounded-xl p-2 text-white text-xs outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setSimLat('16.283905'); setSimLng('80.436636'); }}
                className="text-[0.62rem] bg-white/6 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer"
              >
                📍 Preset: Guntur Route
              </button>
              <button
                type="button"
                onClick={() => { setSimLat('16.5150'); setSimLng('80.5150'); }}
                className="text-[0.62rem] bg-white/6 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer"
              >
                📍 Preset: Amaravati
              </button>
            </div>
          </div>
        )}

        {/* Big tracking button */}
        <button
          onClick={isTracking ? stopTracking : startTracking}
          disabled={!selectedVehicleId}
          className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl border disabled:opacity-40 disabled:cursor-not-allowed ${
            isTracking
              ? 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/20'
              : 'bg-green-500/15 border-green-500/40 text-green-400 hover:bg-green-500/20'
          }`}
          style={{
            boxShadow: isTracking
              ? '0 0 30px rgba(239,68,68,0.2)'
              : '0 0 30px rgba(74,222,128,0.2)',
          }}
        >
          {isTracking
            ? <><Pause size={22} /> Stop Broadcasting</>
            : <><Play size={22} /> Start Tracking</>
          }
        </button>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
            <XCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Live status cards */}
        {isTracking && currentPos && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* GPS accuracy */}
              <div className="bg-white/4 border border-white/10 rounded-xl p-4">
                <div className="text-[0.6rem] text-gray-600 uppercase tracking-widest mb-2">GPS Accuracy</div>
                <div className="flex items-end gap-1">
                  <span className="text-xl font-black text-blue-400">{accuracy}</span>
                  <span className="text-[0.65rem] text-gray-600 mb-0.5">metres</span>
                </div>
                <div className="text-[0.62rem] text-gray-600 mt-1">
                  {accuracy <= 10 ? '🟢 Excellent' : accuracy <= 30 ? '🟡 Good' : '🔴 Poor'}
                </div>
              </div>

              {/* Speed */}
              <div className="bg-white/4 border border-white/10 rounded-xl p-4">
                <div className="text-[0.6rem] text-gray-600 uppercase tracking-widest mb-2">Speed</div>
                <div className="flex items-end gap-1">
                  <span className={`text-xl font-black ${speed > 40 ? 'text-red-400' : 'text-green-400'}`}>
                    {speed}
                  </span>
                  <span className="text-[0.65rem] text-gray-600 mb-0.5">km/h</span>
                </div>
                <div className="text-[0.62rem] text-gray-600 mt-1">
                  {speed > 40 ? '⚠ Overspeeding' : '✓ Normal'}
                </div>
              </div>
            </div>

            {/* Compliance status */}
            {onRoute !== null && (
              <div
                className="flex items-center gap-3 p-4 rounded-xl border"
                style={{
                  background: onRoute ? 'rgba(74,222,128,0.08)' : 'rgba(249,115,22,0.08)',
                  borderColor: onRoute ? 'rgba(74,222,128,0.25)' : 'rgba(249,115,22,0.25)',
                }}
              >
                <Navigation size={20} className={onRoute ? 'text-green-400' : 'text-orange-400'} />
                <div>
                  <div className={`font-black text-sm ${onRoute ? 'text-green-400' : 'text-orange-400'}`}>
                    {onRoute ? 'On Assigned Route ✓' : '⚠ Route Deviation'}
                  </div>
                  <div className="text-[0.65rem] text-gray-600">
                    {onRoute ? 'Staying within 30m of route' : 'Please return to assigned street'}
                  </div>
                </div>
              </div>
            )}

            {/* Behavior score */}
            {behaviorScore !== null && (
              <div className="bg-white/4 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                <div>
                  <div className="text-[0.6rem] text-gray-600 uppercase tracking-widest mb-1">Your Score</div>
                  <div className={`text-3xl font-black ${behaviorScore >= 80 ? 'text-green-400' : behaviorScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {Math.round(behaviorScore)}
                    <span className="text-sm text-gray-600">/100</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${behaviorScore}%`,
                        background: behaviorScore >= 80 ? '#4ADE80' : behaviorScore >= 60 ? '#FBBF24' : '#F87171',
                      }}
                    />
                  </div>
                  <div className="text-[0.62rem] text-gray-600 mt-1.5">
                    {behaviorScore >= 80 ? 'Excellent compliance!' : behaviorScore >= 60 ? 'Good — keep it up' : 'Needs improvement'}
                  </div>
                </div>
              </div>
            )}

            {/* Broadcast count */}
            <div className="text-center text-[0.68rem] text-gray-600">
              <Radio size={10} className="inline mr-1.5 text-green-500" />
              Broadcast #{broadcastCount} · Last at {lastBroadcast}
            </div>

            {/* Coordinates */}
            <div className="bg-white/3 border border-white/8 rounded-xl p-3 font-mono text-[0.65rem] text-gray-600 text-center">
              {currentPos.lat.toFixed(6)}, {currentPos.lng.toFixed(6)}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isTracking && (
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-2xl p-5 text-[0.75rem] text-gray-400 space-y-2">
            <p className="font-bold text-blue-400 text-sm mb-3">How to use this app:</p>
            <p>1. Select your assigned vehicle above</p>
            <p>2. Press <strong className="text-green-400">Start Tracking</strong> at the beginning of your shift</p>
            <p>3. Keep this page open on your phone while driving</p>
            <p>4. Your location will be shared with the control center every 5 seconds</p>
            <p>5. Press <strong className="text-red-400">Stop Broadcasting</strong> at the end of your shift</p>
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-[0.62rem] text-gray-700">
        Swachh Surveillance · AP Gram Panchayat · GPS data is encrypted and used only for official waste management operations
      </footer>
    </div>
  );
}

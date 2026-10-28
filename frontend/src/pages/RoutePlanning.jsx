import React, { useState, useEffect } from 'react';
import { MapPin, Truck, Users, User, ArrowRight, Clock, CheckCircle, Navigation, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/config/api';

const RoutePlanning = () => {
  const [activeTab, setActiveTab] = useState('planning');
  const [streets, setStreets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [wardId, setWardId] = useState('1');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [lengthKm, setLengthKm] = useState('0.5');
  const [householdsCount, setHouseholdsCount] = useState('20');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Vehicles State
  const [vehicles, setVehicles] = useState([]);
  const [assignedVehicleId, setAssignedVehicleId] = useState('');

  // Fetch routes/streets from API
  const fetchStreets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/streets');
      setStreets(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load active routes');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/api/vehicles/public');
      setVehicles(res.data || []);
    } catch (err) {
      console.error('Failed to load vehicles', err);
    }
  };

  useEffect(() => {
    fetchStreets();
    fetchVehicles();
  }, []);

  // Browser Geolocation
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }
    toast.info('Fetching your current location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        toast.success('Successfully set to your current GPS coordinates!');
      },
      (err) => {
        toast.error(`GPS Error: ${err.message}. Make sure location is enabled and site is secure.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit route
  const handleCreateRouteSubmit = async (e) => {
    e.preventDefault();
    if (!routeName.trim() || !lat || !lng) {
      toast.error('Please fill in Name, Latitude, and Longitude');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/api/streets', {
        name: routeName.trim(),
        ward_id: parseInt(wardId, 10),
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        length_km: parseFloat(lengthKm) || 0.5,
        households_count: parseInt(householdsCount, 10) || 20,
        assigned_vehicle_id: assignedVehicleId ? parseInt(assignedVehicleId, 10) : null,
      });
      toast.success('Route successfully created and registered!');
      setShowCreateModal(false);
      // Reset form
      setRouteName('');
      setWardId('1');
      setLat('');
      setLng('');
      setLengthKm('0.5');
      setHouseholdsCount('20');
      setAssignedVehicleId('');
      // Refresh
      fetchStreets();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to create route');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tripHistory = [
    { id: 101, name: "Ward 1 - Core Collection", date: "2026-06-28", planned: "12.4 km", actual: "13.1 km", compliance: 95, missed: 2, idle: "14 mins" },
    { id: 102, name: "Ward 3 - Market Area", date: "2026-06-28", planned: "8.5 km", actual: "8.5 km", compliance: 100, missed: 0, idle: "4 mins" },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="text-blue-400" /> Route Planning & Compliance
          </h1>
          <p className="text-gray-400">Plan daily collections and monitor route execution compliance</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow flex items-center gap-2 font-bold transition-colors cursor-pointer"
        >
          + Create New Route
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 mb-6 pb-2">
        <button
          onClick={() => setActiveTab('planning')}
          className={`px-4 py-2 rounded ${activeTab === 'planning' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-white'}`}
        >
          Active Route Assignments
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded ${activeTab === 'history' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-white'}`}
        >
          Trip Compliance History
        </button>
      </div>

      {/* Planning tab */}
      {activeTab === 'planning' && (
        <>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="text-blue-500 animate-spin" size={36} />
              <span className="text-gray-400 ml-3">Loading active routes...</span>
            </div>
          ) : streets.length === 0 ? (
            <div className="text-center py-16 bg-white/4 border border-white/8 rounded-2xl">
              <p className="text-gray-400 text-sm">No active routes registered yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3.5 text-blue-400 font-bold hover:underline bg-transparent border-none outline-none cursor-pointer"
              >
                Create your first test route
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {streets.map((route) => (
                <div key={route.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-white truncate max-w-[70%]">{route.name}</h3>
                      <span className={`text-[0.68rem] px-2 py-0.5 rounded font-bold ${
                        route.status === 'Covered' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        route.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-gray-500/10 text-gray-300 border border-gray-500/20'
                      }`}>
                        {route.status}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-1"><Truck size={14} /> Assigned Vehicle</span>
                        <span className="text-white font-semibold truncate max-w-[60%]">
                          {(() => {
                            const veh = vehicles.find(v => v.id === route.assigned_vehicle_id);
                            return veh ? `${veh.vehicle_number} (${veh.driver_name || 'No Driver'})` : 'Unassigned';
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-1 font-sans">🏠 Households</span>
                        <span className="text-white">{route.households_count} Units</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-1"><MapPin size={14} /> Coordinates</span>
                        <span className="text-white font-mono text-[0.72rem]">
                          {route.lat ? `${route.lat.toFixed(4)}, ${route.lng.toFixed(4)}` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-1"><Navigation size={14} /> Ward Zone</span>
                        <span className="text-white">Ward {route.ward_id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-blue-400 text-sm font-bold">{route.length_km} km</span>
                    <a
                      href={`/vehicles?id=${route.assigned_vehicle_id || ''}`}
                      className="text-gray-400 hover:text-white flex items-center gap-1 text-sm font-semibold transition-colors"
                    >
                      View Live Map <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-gray-400 text-sm">
                <th className="p-4 border-b border-white/10">Date</th>
                <th className="p-4 border-b border-white/10">Route Name</th>
                <th className="p-4 border-b border-white/10">Planned vs Actual</th>
                <th className="p-4 border-b border-white/10">Idle Time</th>
                <th className="p-4 border-b border-white/10">Missed Streets</th>
                <th className="p-4 border-b border-white/10">Compliance %</th>
              </tr>
            </thead>
            <tbody>
              {tripHistory.map(trip => (
                <tr key={trip.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="p-4 text-white">{trip.date}</td>
                  <td className="p-4 text-white font-medium">{trip.name}</td>
                  <td className="p-4 text-gray-300">
                    {trip.planned} <ArrowRight size={12} className="inline mx-1 text-gray-500" /> {trip.actual}
                  </td>
                  <td className="p-4 text-gray-300 flex items-center gap-2">
                    <Clock size={14} className={trip.idle !== "0 mins" ? "text-orange-400" : "text-gray-500"} /> {trip.idle}
                  </td>
                  <td className="p-4">
                    {trip.missed > 0 ? (
                      <span className="text-red-400 font-bold bg-red-400/10 px-2 py-1 rounded">{trip.missed} Missed</span>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={trip.compliance >= 95 ? "text-green-400 font-bold" : "text-yellow-400 font-bold"}>
                        {trip.compliance}%
                      </span>
                      {trip.compliance >= 95 && <CheckCircle size={14} className="text-green-400" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Route Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateRouteSubmit}
            className="bg-[#0B1220] border border-white/12 rounded-2xl max-w-md w-full p-6 space-y-4 text-white shadow-2xl animate-scaleUp"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-lg font-black tracking-wide text-white">Create New Test Route</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition-colors text-lg font-bold bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Name */}
              <div>
                <label className="block text-[0.65rem] text-gray-400 uppercase font-black tracking-widest mb-1.5">Route / Street Name</label>
                <input
                  type="text"
                  placeholder="e.g. Near My House / Main Road Ext"
                  value={routeName}
                  onChange={e => setRouteName(e.target.value)}
                  required
                  className="w-full bg-white/6 border border-white/12 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  style={{ background: '#070D1A' }}
                />
              </div>

              {/* Ward */}
              <div>
                <label className="block text-[0.65rem] text-gray-400 uppercase font-black tracking-widest mb-1.5">Ward Zone (1 to 8)</label>
                <select
                  value={wardId}
                  onChange={e => setWardId(e.target.value)}
                  className="w-full bg-white/6 border border-white/12 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  style={{ background: '#070D1A' }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num} className="bg-[#070D1A]">Ward {num}</option>
                  ))}
                </select>
              </div>

              {/* Assign Vehicle / Driver */}
              <div>
                <label className="block text-[0.65rem] text-gray-400 uppercase font-black tracking-widest mb-1.5">Assign Vehicle / Driver</label>
                <select
                  value={assignedVehicleId}
                  onChange={e => setAssignedVehicleId(e.target.value)}
                  className="w-full bg-white/6 border border-white/12 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  style={{ background: '#070D1A' }}
                >
                  <option value="" className="bg-[#070D1A]">— Leave Unassigned —</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id} className="bg-[#070D1A]">
                      {v.vehicle_number} · {v.vehicle_name} ({v.driver_name || 'No Driver'})
                    </option>
                  ))}
                </select>
              </div>

              {/* GPS Coordinates Wrapper */}
              <div className="border border-white/8 rounded-xl p-3.5 space-y-3 bg-white/[0.02]">
                <div className="flex justify-between items-center">
                  <span className="text-[0.65rem] text-gray-400 uppercase font-black tracking-widest">GPS Boundaries</span>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="text-[0.68rem] bg-blue-500/15 border border-blue-500/25 text-blue-400 rounded-lg px-2.5 py-1 font-bold hover:bg-blue-500/25 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    📍 Get Current Location
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[0.58rem] text-gray-500 uppercase font-bold mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 16.5150"
                      value={lat}
                      onChange={e => setLat(e.target.value)}
                      required
                      className="w-full bg-white/4 border border-white/8 rounded-lg p-2.5 text-white text-xs outline-none focus:border-blue-500 transition-colors font-mono"
                      style={{ background: '#070D1A' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[0.58rem] text-gray-500 uppercase font-bold mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 80.5150"
                      value={lng}
                      onChange={e => setLng(e.target.value)}
                      required
                      className="w-full bg-white/4 border border-white/8 rounded-lg p-2.5 text-white text-xs outline-none focus:border-blue-500 transition-colors font-mono"
                      style={{ background: '#070D1A' }}
                    />
                  </div>
                </div>
                <p className="text-[0.62rem] text-gray-500 italic mt-1 leading-normal">
                  Pro Tip: Open this page on your mobile phone, click "Get Current Location", and click Save to route the compliance geofence to your physical location!
                </p>
              </div>

              {/* Extra Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.65rem] text-gray-400 uppercase font-black tracking-widest mb-1.5">Length (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.5"
                    value={lengthKm}
                    onChange={e => setLengthKm(e.target.value)}
                    className="w-full bg-white/6 border border-white/12 rounded-xl p-2.5 text-white text-xs outline-none focus:border-blue-500 transition-colors"
                    style={{ background: '#070D1A' }}
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] text-gray-400 uppercase font-black tracking-widest mb-1.5">Households</label>
                  <input
                    type="number"
                    placeholder="20"
                    value={householdsCount}
                    onChange={e => setHouseholdsCount(e.target.value)}
                    className="w-full bg-white/6 border border-white/12 rounded-xl p-2.5 text-white text-xs outline-none focus:border-blue-500 transition-colors"
                    style={{ background: '#070D1A' }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold text-gray-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow"
              >
                {isSubmitting && <Loader2 className="animate-spin" size={13} />}
                Save Route
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RoutePlanning;


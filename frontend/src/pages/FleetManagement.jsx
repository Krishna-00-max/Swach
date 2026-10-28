import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function FleetManagement() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('health');
  const [maintenanceLogs, setMaintenanceLogs] = useState({});

  const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;

  const fetchMaintenance = async (vehicleId) => {
    try {
      const res = await fetch(`${API_URL}/api/vehicles/${vehicleId}/maintenance`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setMaintenanceLogs(prev => ({ ...prev, [vehicleId]: data }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        const [statsRes, vehiclesRes] = await Promise.all([
          fetch(`${API_URL}/api/fleet/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/fleet/vehicles`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (!statsRes.ok || !vehiclesRes.ok) throw new Error("Failed to fetch fleet data");
        
        setStats(await statsRes.json());
        setVehicles(await vehiclesRes.json());
      } catch (err) {
        toast.error("Error loading fleet data");
      } finally {
        setLoading(false);
      }
    };
    fetchFleetData();
  }, [token]);

  if (loading) return <div className="p-10 text-center text-white">Loading Fleet Management...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Fleet & Inventory Management</h1>
        <p className="text-gray-400 text-sm mt-1">Monitor vehicle health, fuel efficiency, and public bin inventory.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card blue">
          <div className="kpi-icon blue">🚚</div>
          <div className="kpi-value">{stats?.vehicles_active || 0} / {stats?.vehicles_total || 0}</div>
          <div className="kpi-label">Active Vehicles</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-icon orange">🔧</div>
          <div className="kpi-value">{stats?.vehicles_maintenance || 0}</div>
          <div className="kpi-label">In Maintenance</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green">🗑️</div>
          <div className="kpi-value">{stats?.total_bins || 0}</div>
          <div className="kpi-label">Total Public Bins</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-icon red">⚠️</div>
          <div className="kpi-value">{stats?.damaged_bins || 0}</div>
          <div className="kpi-label">Damaged Bins</div>
        </div>
      </div>

      <div className="flex gap-2.5 items-center flex-wrap mb-4">
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => setActiveTab('health')} style={{
            padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: activeTab === 'health' ? 'rgba(30,136,229,0.4)' : 'transparent',
            color: activeTab === 'health' ? 'white' : 'var(--gray-400)',
            fontWeight: 600, fontSize: '0.82rem', transition: 'var(--transition-fast)',
          }}>
            Vehicle Health
          </button>
          <button onClick={() => { setActiveTab('maintenance'); vehicles.forEach(v => fetchMaintenance(v.id)); }} style={{
            padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: activeTab === 'maintenance' ? 'rgba(30,136,229,0.4)' : 'transparent',
            color: activeTab === 'maintenance' ? 'white' : 'var(--gray-400)',
            fontWeight: 600, fontSize: '0.82rem', transition: 'var(--transition-fast)',
          }}>
            Maintenance Schedule
          </button>
        </div>
      </div>

      {activeTab === 'health' ? (
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Vehicle Health Status</h2>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle Number</th>
                <th>Driver Name</th>
                <th>Status</th>
                <th>Fuel Efficiency</th>
                <th>Next Maintenance</th>
                <th>Insurance Expiry</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id}>
                  <td className="font-medium">{v.vehicle_number}</td>
                  <td>{v.driver_name}</td>
                  <td>
                    <span className={`badge ${v.status === 'Active' ? 'badge-active' : v.status === 'Maintenance' ? 'badge-leave' : 'badge-offline'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td>{v.fuel_efficiency ? `${v.fuel_efficiency} km/l` : 'N/A'}</td>
                  <td className={v.next_maintenance_date ? '' : 'text-gray-500'}>
                    {v.next_maintenance_date ? new Date(v.next_maintenance_date).toLocaleDateString() : 'Unscheduled'}
                  </td>
                  <td className={v.insurance_expiry_date ? '' : 'text-gray-500'}>
                    {v.insurance_expiry_date ? new Date(v.insurance_expiry_date).toLocaleDateString() : 'Unknown'}
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr><td colSpan="6" className="text-center py-4 text-gray-500">No vehicles found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Maintenance Schedule & History</h2>
        <div className="space-y-6">
          {vehicles.map(v => (
            <div key={v.id} className="border border-white/10 rounded-lg p-4 bg-black/20">
              <h3 className="text-sm font-bold text-blue-400 mb-3">{v.vehicle_number} — {v.vehicle_name}</h3>
              {maintenanceLogs[v.id] && maintenanceLogs[v.id].length > 0 ? (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Description</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceLogs[v.id].map(log => (
                      <tr key={log.id} className="border-b border-white/5">
                        <td className="py-2 text-gray-300">{new Date(log.scheduled_date).toLocaleDateString()}</td>
                        <td className="py-2 text-gray-200">{log.description}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-[0.65rem] font-bold ${log.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2 text-gray-300">₹{log.cost || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-xs text-gray-500 italic">No maintenance records found for this vehicle.</div>
              )}
              <div className="mt-3">
                <button className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded hover:bg-blue-500/20 transition-colors">
                  + Schedule Maintenance
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}

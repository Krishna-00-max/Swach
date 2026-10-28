import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Truck, MessageSquare, CheckCircle, AlertTriangle,
  Star, Clock, TrendingUp, TrendingDown, RefreshCw, Users, CloudRain
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useAPI } from '../hooks/useAPI';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import ExecutiveDashboard from './ExecutiveDashboard';

const KPICard = ({ label, value, icon: Icon, color = 'blue', unit = '', trend }) => (
  <div className={`kpi-card ${color}`}>
    <div className={`kpi-icon ${color}`}><Icon size={22} /></div>
    <div className="kpi-value" style={{
      background: color === 'green'
        ? 'linear-gradient(90deg, #10B981, #34D399)'
        : color === 'blue'
        ? 'linear-gradient(90deg, #3B82F6, #60A5FA)'
        : color === 'orange'
        ? 'linear-gradient(90deg, #FB923C, #FBBF24)'
        : 'linear-gradient(90deg, #EF4444, #F87171)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    }}>
      {value ?? '—'}{unit}
    </div>
    <div className="kpi-label">{label}</div>
    {trend !== undefined && (
      <div className={`kpi-trend ${trend >= 0 ? 'up' : 'down'}`}>
        {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {Math.abs(trend)}% vs yesterday
      </div>
    )}
  </div>
);

const WeatherWidget = () => (
  <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/10 border border-blue-500/20 rounded-xl p-5 mb-6 flex items-center justify-between shadow-lg transition-all hover:border-blue-500/40">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
        <CloudRain size={24} />
      </div>
      <div>
        <h3 className="text-white font-bold text-sm mb-0.5">Amaravati Weather (Live)</h3>
        <p className="text-xs text-blue-300">Light Rain • 28°C • 60% Humidity</p>
      </div>
    </div>
    <div className="text-right hidden sm:block">
      <div className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
        ⚠️ Expect 15 min delays in Ward 3 & 4
      </div>
    </div>
  </div>
);

function CitizenDashboard({ kpis, complaints, user, handleRefresh, kpiLoading }) {
  const navigate = useNavigate();
  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 4px 0' }}>📢 Citizen Hub</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0 }}>
            Welcome back, {user.full_name}! Track your ward's waste status.
          </p>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[0.8rem] font-semibold transition-colors bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white" onClick={handleRefresh}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      {kpiLoading ? (
        <div className="flex flex-col items-center justify-center p-15 gap-4 text-gray-400">
          <div className="w-9 h-9 rounded-full border-4 border-white/10 border-t-blue-500 animate-spin" />
          <span>Loading Ward Data...</span>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(220px,1fr))] mb-6">
          <KPICard label="Ward Cleanliness Score" value={kpis.cleanliness_score} icon={Star} color="green" unit="/100" />
          <KPICard label="Streets Cleaned Today" value={`${kpis.streets_covered_today}/${kpis.streets_total}`} icon={MapPin} color="blue" />
          <KPICard label="Active Collection Trucks" value={kpis.active_vehicles} icon={Truck} color="blue" />
          <KPICard label="Unresolved Ward Issues" value={kpis.pending_areas} icon={AlertTriangle} color="red" />
        </div>
      )}

      {/* Ward Status Section */}
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '0.95rem', marginBottom: 12, marginTop: 0 }}>
          📍 Your Ward Cleanliness Level
        </h3>
        <div className="progress-bar-wrap" style={{ height: 12 }}>
          <div className="progress-bar-fill" style={{ width: `${kpis.coverage_percent || 0}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
          <span>{kpis.streets_covered_today || 0} of {kpis.streets_total || 0} streets serviced today</span>
          <span style={{ fontWeight: 700, color: '#10B981' }}>{kpis.coverage_percent || 0}% Cleanliness Rating</span>
        </div>
      </div>

      {/* Recent Ward Complaints */}
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl" style={{ padding: 20 }}>
        <div className="text-base font-bold text-gray-100 mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent" style={{ color: 'var(--foreground)' }}>🚨 Active Ward Issues</div>
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th>ID</th><th>Category</th><th>Address</th><th>Status</th><th>Raised At</th>
              </tr>
            </thead>
            <tbody>
              {(complaints || []).map(c => (
                <tr key={c.id}>
                  <td><code style={{ color: 'var(--primary)', fontSize: '0.78rem' }}>{c.complaint_number}</code></td>
                  <td style={{ fontSize: '0.85rem' }}>{c.category}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{c.address || '—'}</td>
                  <td>
                    <span className={`badge badge-${c.status.toLowerCase().replace(' ', '-')}`}>
                      <span className="badge-dot" /> {c.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>
                    {c.raised_at ? format(new Date(c.raised_at), 'dd MMM, hh:mm a') : '—'}
                  </td>
                </tr>
              ))}
              {(!complaints || complaints.length === 0) && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: 24 }}>No issues reported in your ward today. Keep up the clean work!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: kpis, loading: kpiLoading, refetch: refetchKPIs } = useAPI('/api/stats/kpis', { defaultValue: {} });
  const { data: weekly, loading: weeklyLoading } = useAPI('/api/stats/weekly', { defaultValue: [] });
  const { data: complaints } = useAPI('/api/complaints?limit=5', { defaultValue: [] });

  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = async () => {
    await refetchKPIs();
    setLastRefresh(new Date());
  };

  if (user?.role === 'citizen') {
    return (
      <CitizenDashboard 
        kpis={kpis} 
        complaints={complaints} 
        user={user} 
        handleRefresh={handleRefresh} 
        kpiLoading={kpiLoading} 
      />
    );
  }

  const weeklyChartData = Array.isArray(weekly)
    ? weekly.slice().reverse().map(d => ({
        date: format(new Date(d.date), 'dd MMM'),
        streets: d.streets,
        households: Math.round(d.households / 10),
        complaints: d.complaints,
        score: d.score,
      }))
    : [];

  if (user?.role === 'municipal_officer') {
    return (
      <ExecutiveDashboard 
        kpis={kpis} 
        weeklyChartData={weeklyChartData}
        handleRefresh={handleRefresh} 
        kpiLoading={kpiLoading} 
      />
    );
  }



  const getDashboardTitle = () => {
    if (user?.role === 'admin') return '🏘️ Panchayat Operations Command';
    if (user?.role === 'municipal_officer') return '🏢 Municipal Operations Center';
    if (user?.role === 'panchayat_official') return `🌾 Ward ${user.ward_id || 1} Official Portal`;
    if (user?.role === 'supervisor') return `👷 Ward ${user.ward_id || 1} Supervisor Portal`;
    return '🏘️ Dashboard Overview';
  };

  const getDashboardSub = () => {
    if (user?.role === 'panchayat_official') return 'Gram Panchayat Ward Representative Monitoring View';
    if (user?.role === 'supervisor') return 'Field Staff & Cleanliness Route Supervision View';
    return 'Rajpur Gram Panchayat · Real-time data feed';
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 4px 0' }}>{getDashboardTitle()}</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0 }}>
            {getDashboardSub()} · Last updated: {format(lastRefresh, 'hh:mm:ss a')}
          </p>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[0.8rem] font-semibold transition-colors bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white" onClick={handleRefresh}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      {kpiLoading ? (
        <div className="flex flex-col items-center justify-center p-15 gap-4 text-gray-400">
          <div className="w-9 h-9 rounded-full border-4 border-white/10 border-t-blue-500 animate-spin" />
          <span>Loading KPIs...</span>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] mb-6">
          <KPICard label="Streets Covered Today"       value={kpis.streets_covered_today}  icon={MapPin}       color="green" trend={5} />
          <KPICard label="Households Surveyed"         value={kpis.households_visited}       icon={Users}        color="blue"  trend={3} />
          <KPICard label="Active Vehicles"             value={`${kpis.active_vehicles}/${kpis.total_vehicles}`} icon={Truck} color="blue" />
          <KPICard label="Complaints Today"            value={kpis.complaints_raised_today}  icon={MessageSquare}color="orange" trend={-8} />
          <KPICard label="Complaints Resolved"         value={kpis.complaints_resolved}      icon={CheckCircle}  color="green" />
          <KPICard label="Cleanliness Score"           value={kpis.cleanliness_score}        icon={Star}         color="green" unit="/100" trend={2} />
          <KPICard label="Pending Areas"               value={kpis.pending_areas}            icon={AlertTriangle} color="red" />
          <KPICard label="Coverage %"                  value={kpis.coverage_percent}         icon={TrendingUp}   color="blue" unit="%" />
        </div>
      )}

      {/* Main Command Center Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* GIS Map Panel */}
        <div className="lg:col-span-2 bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl flex flex-col transition-all hover:border-white/[0.14] hover:shadow-lg overflow-hidden" style={{ minHeight: 400 }}>
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
            <span style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '0.9rem' }} className="flex items-center gap-2">
              <MapPin size={18} className="text-blue-400" /> Live Operations Map
            </span>
            <div className="flex gap-2">
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">Boundaries</span>
              <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded border border-green-500/30">Live Vehicles</span>
              <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded border border-red-500/30">Heatmap</span>
            </div>
          </div>
          <div className="flex-1 bg-[#1a2535] relative flex items-center justify-center">
            {/* Map Placeholder */}
            <div className="absolute inset-0" style={{ background: 'url("https://www.transparenttextures.com/patterns/cubes.png"), radial-gradient(circle at center, #1e293b, #0f172a)' }} />
            <div className="z-10 text-center">
              <MapPin size={48} className="mx-auto text-blue-500/50 mb-4" />
              <p className="text-blue-400 font-bold uppercase tracking-wider text-sm">MapLibre GIS Engine Initializing...</p>
              <p className="text-gray-500 text-xs mt-2">Displaying 14 Wards · 8 Vehicles · 42 Complaints</p>
            </div>
          </div>
        </div>

        {/* Action Center / Right Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Coverage Progress */}
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all hover:border-white/[0.14] hover:shadow-lg p-5">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '0.9rem' }}>
                📍 Daily Coverage Progress
              </span>
              <span style={{ fontSize: '0.875rem', color: '#10B981', fontWeight: 700 }}>
                {kpis.coverage_percent || 0}%
              </span>
            </div>
            <div className="progress-bar-wrap" style={{ height: 12 }}>
              <div className="progress-bar-fill" style={{ width: `${kpis.coverage_percent || 0}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
              <span>✅ {kpis.streets_covered_today || 0} Covered</span>
              <span>❌ {kpis.pending_areas || 0} Pending</span>
              <span>Total: {kpis.streets_total || 0}</span>
            </div>
          </div>
          
          <WeatherWidget />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(380px,1fr))] mb-6" style={{ marginBottom: 20 }}>
        {/* Weekly Trend */}
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all hover:border-white/[0.14] hover:shadow-lg" style={{ padding: 20 }}>
          <div className="text-base font-bold text-gray-100 mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent" style={{ color: 'var(--foreground)' }}>📈 Weekly Street Coverage</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--foreground)' }} />
              <Line type="monotone" dataKey="streets" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} name="Streets" />
              <Line type="monotone" dataKey="score"   stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 3 }} name="Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Complaint Bar Chart */}
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all hover:border-white/[0.14] hover:shadow-lg" style={{ padding: 20 }}>
          <div className="text-base font-bold text-gray-100 mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent" style={{ color: 'var(--foreground)' }}>📊 Complaints This Week</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--foreground)' }} />
              <Bar dataKey="complaints" fill="#FB923C" radius={[4,4,0,0]} name="Raised" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all hover:border-white/[0.14] hover:shadow-lg" style={{ padding: 20 }}>
        <div className="text-base font-bold text-gray-100 mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent" style={{ color: 'var(--foreground)' }}>🚨 Recent Complaints</div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Category</th><th>Address</th><th>Status</th><th>Raised At</th>
              </tr>
            </thead>
            <tbody>
              {(complaints || []).slice(0, 5).map(c => (
                <tr key={c.id}>
                  <td><code style={{ color: 'var(--primary)', fontSize: '0.78rem', background: 'transparent' }}>{c.complaint_number}</code></td>
                  <td style={{ fontSize: '0.85rem' }}>{c.category}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{c.address || '—'}</td>
                  <td>
                    <span className={`badge badge-${c.status.toLowerCase().replace(' ', '-')}`}>
                      <span className="badge-dot" /> {c.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>
                    {c.raised_at ? format(new Date(c.raised_at), 'dd MMM, hh:mm a') : '—'}
                  </td>
                </tr>
              ))}
              {(!complaints || complaints.length === 0) && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: 24 }}>No complaints found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

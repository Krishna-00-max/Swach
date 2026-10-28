import { useState } from 'react';
import { Download, BarChart2, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ComposedChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useAPI } from '../hooks/useAPI';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Map, MapMarker, MarkerContent, MapControls } from '@/components/ui/map';

const COLORS = ['#43A047', '#1E88E5', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export default function Analytics() {
  const { data: daily } = useAPI('/api/stats/daily?days=30', { defaultValue: [] });
  const { data: weekly } = useAPI('/api/stats/weekly', { defaultValue: [] });
  const { data: vehicleStats } = useAPI('/api/vehicles/stats/summary', { defaultValue: {} });
  const { data: complaints } = useAPI('/api/complaints?limit=100', { defaultValue: [] });
  const [activeTab, setActiveTab] = useState('weekly');

  const weeklyChartData = Array.isArray(weekly)
    ? weekly.slice().reverse().map(d => ({
        date: format(new Date(d.date), 'dd MMM'),
        streets: d.streets, households: d.households,
        complaints: d.complaints, resolved: d.resolved,
        score: d.score, waste: Math.round(d.waste_kg / 100) * 100,
      }))
    : [];

  const dailyChartData = Array.isArray(daily)
    ? daily.slice().reverse().slice(-14).map(d => ({
        date: format(new Date(d.date), 'dd MMM'),
        streets: d.streets_covered, households: d.households_visited,
        complaints: d.complaints_raised, score: d.cleanliness_score,
        waste: Math.round(d.waste_collected_kg),
      }))
    : [];

  const vehiclePieData = [
    { name: 'Active', value: vehicleStats?.active || 3, color: '#4ADE80' },
    { name: 'Delayed', value: vehicleStats?.delayed || 2, color: '#FCD34D' },
    { name: 'Offline', value: vehicleStats?.offline || 1, color: '#F87171' },
  ];

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('Swachh Surveillance — Analytics Report', 14, 22);
    doc.setFontSize(11); doc.text(`Generated: ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}`, 14, 30);
    doc.text(`Rajpur Gram Panchayat`, 14, 37);
    autoTable(doc, {
      head: [['Date', 'Streets', 'Households', 'Complaints', 'Cleanliness Score', 'Waste (kg)']],
      body: dailyChartData.map(d => [d.date, d.streets, d.households, d.complaints, `${d.score}/100`, d.waste]),
      startY: 45, theme: 'striped',
      headStyles: { fillColor: [13, 71, 161], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 245, 255] },
    });
    doc.save('swachh_analytics_report.pdf');
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(dailyChartData.map(d => ({
      Date: d.date, 'Streets Covered': d.streets, 'Households': d.households,
      'Complaints': d.complaints, 'Cleanliness Score': d.score, 'Waste (kg)': d.waste
    })));
    XLSX.utils.book_append_sheet(wb, ws1, 'Daily Analytics');
    const ws2 = XLSX.utils.json_to_sheet([vehicleStats]);
    XLSX.utils.book_append_sheet(wb, ws2, 'Vehicle Stats');
    XLSX.writeFile(wb, 'swachh_analytics.xlsx');
  };

  const chartData = activeTab === 'weekly' ? weeklyChartData : dailyChartData;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[1.6rem] font-extrabold text-white mb-1">📊 Analytics Dashboard</h2>
          <p className="text-sm text-gray-400">Performance metrics, trends, and waste collection reports</p>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
            {['weekly','daily'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: activeTab === t ? 'rgba(30,136,229,0.4)' : 'transparent',
                color: activeTab === t ? 'white' : 'var(--gray-400)',
                fontWeight: 600, fontSize: '0.82rem', textTransform: 'capitalize',
                transition: 'var(--transition-fast)',
              }}>{t}</button>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[0.8rem] font-semibold transition-colors bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white" onClick={exportPDF}><Download size={14} />PDF Report</button>
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[0.8rem] font-semibold transition-colors bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white" onClick={exportExcel}><Download size={14} />Excel</button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all hover:border-white/[0.14] hover:shadow-lg" style={{ padding: 24, marginBottom: 20 }}>
        <div className="text-base font-bold text-gray-100 mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent">📈 Street Coverage & Cleanliness Score Trend ({activeTab === 'weekly' ? '7 Days' : '14 Days'})</div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
            <Legend wrapperStyle={{ color: '#9CA3AF', fontSize: '0.8rem' }} />
            <Area yAxisId="left" type="monotone" dataKey="streets" fill="rgba(67,160,71,0.15)" stroke="#43A047" strokeWidth={2} name="Streets Covered" />
            <Line yAxisId="right" type="monotone" dataKey="score" stroke="#1E88E5" strokeWidth={2.5} dot={{ fill: '#1E88E5', r: 3 }} name="Cleanliness Score" />
            <Bar yAxisId="left" dataKey="complaints" fill="#F59E0B" radius={[3,3,0,0]} name="Complaints" opacity={0.8} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Complaint Heatmap */}
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all hover:border-white/[0.14] hover:shadow-lg mb-6 flex flex-col h-[400px]">
        <div className="p-5 pb-3 flex justify-between items-center">
          <div className="text-base font-bold text-gray-100 flex items-center gap-2">🔥 Complaint Density Heatmap</div>
          <span className="text-[0.7rem] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">Live Monitoring</span>
        </div>
        <div className="flex-1 rounded-b-xl overflow-hidden relative bg-gray-900 border-t border-white/5">
          <Map viewport={{ center: [80.5165, 16.5131], zoom: 12.5 }} theme="dark">
            <MapControls position="top-right" />
            {(complaints || []).filter(c => c.lat && c.lng).map(c => (
              <MapMarker key={c.id} longitude={c.lng} latitude={c.lat}>
                <MarkerContent>
                  <div className="w-8 h-8 rounded-full bg-red-500/30 flex items-center justify-center pointer-events-none">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                  </div>
                </MarkerContent>
              </MapMarker>
            ))}
          </Map>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(380px,1fr))] mb-6">
        {/* Waste Collection */}
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all hover:border-white/[0.14] hover:shadow-lg" style={{ padding: 20 }}>
          <div className="text-base font-bold text-gray-100 mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent">🗑️ Waste Collected (kg)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Bar dataKey="waste" fill="#43A047" radius={[4,4,0,0]} name="Waste (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Households Visited */}
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all hover:border-white/[0.14] hover:shadow-lg" style={{ padding: 20 }}>
          <div className="text-base font-bold text-gray-100 mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent">🏠 Households Visited</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="households" stroke="#60A5FA" strokeWidth={2} dot={{ fill: '#60A5FA', r: 3 }} name="Households" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Utilization */}
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all hover:border-white/[0.14] hover:shadow-lg" style={{ padding: 20 }}>
          <div className="text-base font-bold text-gray-100 mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent">🚛 Vehicle Utilization</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={vehiclePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                  {vehiclePieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {vehiclePieData.map(v => (
                <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: v.color }} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--gray-300)' }}>{v.name}</span>
                  <span style={{ fontWeight: 700, color: v.color }}>{v.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--gray-400)' }}>
                Total: {vehicleStats?.total || 0} vehicles
              </div>
            </div>
          </div>
        </div>

        {/* Complaint Resolution */}
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all hover:border-white/[0.14] hover:shadow-lg" style={{ padding: 20 }}>
          <div className="text-base font-bold text-gray-100 mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent">✅ Complaints — Raised vs Resolved</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Legend wrapperStyle={{ color: '#9CA3AF', fontSize: '0.78rem' }} />
              <Bar dataKey="complaints" fill="#F59E0B" radius={[3,3,0,0]} name="Raised" />
              <Bar dataKey="resolved" fill="#43A047" radius={[3,3,0,0]} name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

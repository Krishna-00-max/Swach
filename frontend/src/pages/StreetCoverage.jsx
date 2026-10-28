import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Download, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAPI } from '../hooks/useAPI';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const STATUS_ICON = {
  Covered: <CheckCircle size={14} color="#4ADE80" />,
  Missed: <XCircle size={14} color="#F87171" />,
  'In Progress': <Clock size={14} color="#FCD34D" />,
  Scheduled: <Clock size={14} color="#9CA3AF" />,
};

const WARD_COLORS = ['#43A047', '#1E88E5', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export default function StreetCoverage() {
  const { data: streets, loading } = useAPI('/api/streets', { defaultValue: [] });
  const { data: coverage } = useAPI('/api/streets/coverage', { defaultValue: {} });
  const [filterWard, setFilterWard] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = (streets || []).filter(s => {
    if (filterWard && s.ward_id !== parseInt(filterWard)) return false;
    if (filterStatus && s.status !== filterStatus) return false;
    return true;
  });

  const wardChartData = (coverage?.by_ward || []).map((w, i) => ({
    name: `Ward ${w.ward_id}`, covered: w.covered, missed: w.missed, value: w.covered,
    fill: WARD_COLORS[i % WARD_COLORS.length]
  }));

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text('Street Coverage Report', 14, 20);
    doc.setFontSize(10); doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 14, 28);
    doc.text(`Overall Coverage: ${coverage?.overall_coverage || 0}%`, 14, 36);
    autoTable(doc, {
      head: [['Street', 'Ward', 'Status', 'Households', 'Covered At']],
      body: filtered.map(s => [s.name, `Ward ${s.ward_id}`, s.status, s.households_count,
        s.covered_at ? format(new Date(s.covered_at), 'dd MMM hh:mm a') : '—']),
      startY: 44, theme: 'striped',
      headStyles: { fillColor: [13, 71, 161], textColor: 255 },
    });
    doc.save('street_coverage_report.pdf');
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(s => ({
      Street: s.name, Ward: `Ward ${s.ward_id}`, Status: s.status,
      Households: s.households_count, 'Length(km)': s.length_km,
      'Covered At': s.covered_at ? format(new Date(s.covered_at), 'dd MMM hh:mm a') : '—'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Streets');
    XLSX.writeFile(wb, 'street_coverage.xlsx');
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[1.6rem] font-extrabold text-white mb-1">📍 Street Coverage Monitoring</h2>
          <p className="text-sm text-gray-400">
            {coverage?.covered || 0} of {coverage?.total_streets || 0} streets covered · {coverage?.overall_coverage || 0}% overall
          </p>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[0.8rem] font-semibold transition-colors bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white" onClick={exportPDF}><Download size={14} />PDF</button>
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[0.8rem] font-semibold transition-colors bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white" onClick={exportExcel}><Download size={14} />Excel</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Streets', value: coverage?.total_streets || 0, color: '#60A5FA' },
          { label: 'Covered', value: coverage?.covered || 0, color: '#4ADE80' },
          { label: 'Missed', value: coverage?.missed || 0, color: '#F87171' },
          { label: 'In Progress', value: coverage?.in_progress || 0, color: '#FCD34D' },
        ].map(c => (
          <div key={c.label} className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all hover:border-white/[0.14] hover:shadow-lg" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 16, marginBottom: 20 }}>
        {/* Pie Chart */}
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all hover:border-white/[0.14] hover:shadow-lg" style={{ padding: 20 }}>
          <div className="text-base font-bold text-gray-100 mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent">Ward-wise Coverage</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={wardChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {wardChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Ward table */}
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all hover:border-white/[0.14] hover:shadow-lg" style={{ padding: 20 }}>
          <div className="text-base font-bold text-gray-100 mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent">Ward-wise Summary</div>
          <table className="data-table">
            <thead>
              <tr><th>Ward</th><th>Total</th><th>Covered</th><th>Missed</th><th>Coverage %</th></tr>
            </thead>
            <tbody>
              {(coverage?.by_ward || []).map((w, i) => (
                <tr key={w.ward_id}>
                  <td style={{ fontWeight: 600, color: WARD_COLORS[i % WARD_COLORS.length] }}>Ward {w.ward_id}</td>
                  <td>{w.total}</td>
                  <td style={{ color: '#4ADE80' }}>{w.covered}</td>
                  <td style={{ color: '#F87171' }}>{w.missed}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar-wrap" style={{ flex: 1, height: 6 }}>
                        <div className="progress-bar-fill" style={{ width: `${w.coverage_percent}%` }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gray-300)', minWidth: 36 }}>{w.coverage_percent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter + Street Table */}
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all hover:border-white/[0.14] hover:shadow-lg" style={{ padding: 20 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="text-base font-bold text-gray-100 mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent" style={{ marginBottom: 0, flex: 1 }}>Street Details</div>
          <select className="bg-white/5 border border-white/10 rounded-md px-3.5 py-2.5 text-gray-100 text-sm transition-fast w-full focus:outline-none focus:border-blue-500 focus:bg-blue-500/10 focus:ring-[3px] focus:ring-blue-500/15" style={{ width: 140 }} value={filterWard} onChange={e => setFilterWard(e.target.value)}>
            <option value="">All Wards</option>
            {[1,2,3,4,5,6,7,8].map(w => <option key={w} value={w}>Ward {w}</option>)}
          </select>
          <select className="bg-white/5 border border-white/10 rounded-md px-3.5 py-2.5 text-gray-100 text-sm transition-fast w-full focus:outline-none focus:border-blue-500 focus:bg-blue-500/10 focus:ring-[3px] focus:ring-blue-500/15" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {['Covered','Missed','In Progress','Scheduled'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center p-15 gap-4 text-gray-400"><div className="w-9 h-9 rounded-full border-4 border-white/10 border-t-blue-500 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto rounded-lg">
            <table className="data-table">
              <thead>
                <tr><th>Street Name</th><th>Ward</th><th>Status</th><th>Households</th><th>Length</th><th>Covered At</th></tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td><span style={{ background: 'rgba(30,136,229,0.15)', color: '#60A5FA', padding: '2px 8px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>Ward {s.ward_id}</span></td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem' }}>
                        {STATUS_ICON[s.status]} {s.status}
                      </span>
                    </td>
                    <td>{s.households_count}</td>
                    <td>{s.length_km} km</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>
                      {s.covered_at ? format(new Date(s.covered_at), 'dd MMM, hh:mm a') : '—'}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--gray-500)' }}>No streets found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

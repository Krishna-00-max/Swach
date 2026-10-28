import { useState } from 'react';
import { MessageSquare, Plus, X, Send, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAPI, usePost } from '../hooks/useAPI';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../config/api';

const CATEGORIES = [
  'Garbage Not Collected','Overflowing Bin','Illegal Dumping',
  'Drain Blocked','Sanitation Issue','Vehicle Missed','Other'
];

const STATUS_COLOR = {
  Raised: '#F97316', Assigned: '#60A5FA', 'In Progress': '#FCD34D', Resolved: '#4ADE80', Rejected: '#F87171'
};

const PRESET_IMAGES = [
  { label: 'Clean Street (Pass)', url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600' },
  { label: 'Littered Bin (Fail)', url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600' }
];

export default function Complaints() {
  const { data: complaints, loading, refetch } = useAPI('/api/complaints', { defaultValue: [] });
  const { data: stats } = useAPI('/api/complaints/stats/summary', { defaultValue: {} });
  const { post, loading: submitting } = usePost();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({
    category: '', description: '', raised_by: '', raised_by_phone: '',
    address: '', ward_id: '', lat: '', lng: ''
  });

  const [verifyingComplaintId, setVerifyingComplaintId] = useState(null);
  const [verifyImageUrl, setVerifyImageUrl] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await post('/api/complaints', {
      ...form,
      ward_id: form.ward_id ? parseInt(form.ward_id) : null,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
    });
    if (result.success) {
      toast.success(`Complaint ${result.data.complaint_number} submitted!`);
      setShowForm(false);
      setForm({ category: '', description: '', raised_by: '', raised_by_phone: '', address: '', ward_id: '', lat: '', lng: '' });
      refetch();
    } else {
      toast.error(result.error);
    }
  };

  const updateStatus = async (id, status) => {
    if (status === 'Resolved') {
      setVerifyingComplaintId(id);
      setVerifyImageUrl('');
      setAuditResult(null);
      return;
    }
    try {
      await api.patch(`/api/complaints/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      refetch();
    } catch { toast.error('Failed to update status'); }
  };

  const handleVerifyCleanliness = async () => {
    if (!verifyImageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }
    setVerifying(true);
    try {
      const res = await api.post(`/api/complaints/${verifyingComplaintId}/verify-cleanliness`, {
        image_url: verifyImageUrl
      });
      setAuditResult(res.data);
      toast.success('AI Audit completed successfully!');
    } catch {
      toast.error('AI Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleApproveResolution = async () => {
    try {
      const notes = auditResult 
        ? `AI Cleanliness Score: ${auditResult.score}/100. Notes: ${auditResult.notes}`
        : 'Resolved manually without photo.';
      await api.patch(`/api/complaints/${verifyingComplaintId}/status`, {
        status: 'Resolved',
        resolution_notes: notes
      });
      toast.success('Complaint resolution approved & verified!');
      setVerifyingComplaintId(null);
      refetch();
    } catch {
      toast.error('Failed to resolve complaint');
    }
  };

  const filtered = (complaints || []).filter(c => !filterStatus || c.status === filterStatus);

  const categoryData = Object.entries(stats?.by_category || {}).map(([k, v]) => ({ name: k.replace(' ', '\n'), value: v }));

  return (
    <div className="animate-fadeIn">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[1.6rem] font-extrabold text-white mb-1">🚨 Complaint Management</h2>
          <p className="text-sm text-gray-400">{stats?.total || 0} total · {stats?.today || 0} today · {stats?.resolved || 0} resolved</p>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-all duration-300 bg-gradient-to-br from-green-600 to-green-800 text-white shadow-[0_2px_8px_rgba(67,160,71,0.4)] hover:-translate-y-1 hover:shadow-[0_4px_16px_rgba(67,160,71,0.6)] border-none cursor-pointer" onClick={() => setShowForm(true)}>
            <Plus size={16} /> New Complaint
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: stats?.total, color: '#60A5FA' },
          { label: 'Raised Today', value: stats?.today, color: '#F97316' },
          { label: 'Raised', value: stats?.raised, color: '#F97316' },
          { label: 'In Progress', value: stats?.in_progress, color: '#FCD34D' },
          { label: 'Resolved', value: stats?.resolved, color: '#4ADE80' },
        ].map(c => (
          <div key={c.label} className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all duration-300 hover:border-white/[0.14] hover:shadow-lg hover:-translate-y-1 cursor-default" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: c.color }}>{c.value ?? '—'}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Chart + Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 20 }}>
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all hover:border-white/[0.14] hover:shadow-lg" style={{ padding: 20 }}>
          <div className="text-base font-bold text-gray-100 mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent">By Category</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 9 }} width={90} />
              <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Bar dataKey="value" fill="#F59E0B" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all hover:border-white/[0.14] hover:shadow-lg" style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <div className="text-base font-bold text-gray-100 mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent" style={{ marginBottom: 0, flex: 1 }}>Complaints List</div>
            <select className="bg-white/5 border border-white/10 rounded-md px-3.5 py-2.5 text-gray-100 text-sm transition-fast w-full focus:outline-none focus:border-blue-500 focus:bg-blue-500/10 focus:ring-[3px] focus:ring-blue-500/15" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              {['Raised','Assigned','In Progress','Resolved','Rejected'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {loading ? <div className="flex flex-col items-center justify-center p-15 gap-4 text-gray-400"><div className="w-9 h-9 rounded-full border-4 border-white/10 border-t-blue-500 animate-spin" /></div> : (
            <div className="overflow-x-auto rounded-lg" style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table className="w-full border-collapse text-sm">
                <thead><tr><th>ID</th><th>Category</th><th>By</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="py-2.5 px-3 border-b border-white/5"><code style={{ color: 'var(--blue-400)', fontSize: '0.75rem' }}>{c.complaint_number}</code></td>
                      <td className="py-2.5 px-3 border-b border-white/5" style={{ fontSize: '0.82rem' }}>{c.category}</td>
                      <td className="py-2.5 px-3 border-b border-white/5" style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{c.raised_by}</td>
                      <td className="py-2.5 px-3 border-b border-white/5">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600, background: `${STATUS_COLOR[c.status]}20`, color: STATUS_COLOR[c.status], border: `1px solid ${STATUS_COLOR[c.status]}40` }}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-b border-white/5" style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{c.raised_at ? format(new Date(c.raised_at), 'dd MMM') : '—'}</td>
                      <td className="py-2.5 px-3 border-b border-white/5">
                        {c.status !== 'Resolved' && (
                          <select
                            className="bg-white/5 border border-white/10 rounded-md px-3.5 py-2.5 text-gray-100 text-sm transition-fast w-full focus:outline-none focus:border-blue-500 focus:bg-blue-500/10 focus:ring-[3px] focus:ring-blue-500/15" style={{ fontSize: '0.72rem', padding: '4px 6px', width: 110 }}
                            value={c.status} onChange={e => updateStatus(c.id, e.target.value)}
                          >
                            {['Raised','Assigned','In Progress','Resolved'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Complaint Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#1a2535', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>📝 New Complaint</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="flex flex-col gap-1.5" style={{ gridColumn: '1/-1' }}>
                  <label className="text-[0.82rem] font-semibold text-gray-300 tracking-[0.02em]">Category *</label>
                  <select required className="bg-white/5 border border-white/10 rounded-md px-3.5 py-2.5 text-gray-100 text-sm transition-fast w-full focus:outline-none focus:border-blue-500 focus:bg-blue-500/10 focus:ring-[3px] focus:ring-blue-500/15" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select category...</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5"><label className="text-[0.82rem] font-semibold text-gray-300 tracking-[0.02em]">Citizen Name *</label><input required className="bg-white/5 border border-white/10 rounded-md px-3.5 py-2.5 text-gray-100 text-sm transition-fast w-full focus:outline-none focus:border-blue-500 focus:bg-blue-500/10 focus:ring-[3px] focus:ring-blue-500/15" value={form.raised_by} onChange={e => setForm({ ...form, raised_by: e.target.value })} placeholder="Ram Kumar" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-[0.82rem] font-semibold text-gray-300 tracking-[0.02em]">Phone</label><input className="bg-white/5 border border-white/10 rounded-md px-3.5 py-2.5 text-gray-100 text-sm transition-fast w-full focus:outline-none focus:border-blue-500 focus:bg-blue-500/10 focus:ring-[3px] focus:ring-blue-500/15" value={form.raised_by_phone} onChange={e => setForm({ ...form, raised_by_phone: e.target.value })} placeholder="9876543210" /></div>
                <div className="flex flex-col gap-1.5" style={{ gridColumn: '1/-1' }}>
                  <label className="text-[0.82rem] font-semibold text-gray-300 tracking-[0.02em]">Description *</label>
                  <textarea required className="bg-white/5 border border-white/10 rounded-md px-3.5 py-2.5 text-gray-100 text-sm transition-fast w-full focus:outline-none focus:border-blue-500 focus:bg-blue-500/10 focus:ring-[3px] focus:ring-blue-500/15" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue in detail..." />
                </div>
                <div className="flex flex-col gap-1.5" style={{ gridColumn: '1/-1' }}><label className="text-[0.82rem] font-semibold text-gray-300 tracking-[0.02em]">Address</label><input className="bg-white/5 border border-white/10 rounded-md px-3.5 py-2.5 text-gray-100 text-sm transition-fast w-full focus:outline-none focus:border-blue-500 focus:bg-blue-500/10 focus:ring-[3px] focus:ring-blue-500/15" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Street name, area" /></div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.82rem] font-semibold text-gray-300 tracking-[0.02em]">Ward</label>
                  <select className="bg-white/5 border border-white/10 rounded-md px-3.5 py-2.5 text-gray-100 text-sm transition-fast w-full focus:outline-none focus:border-blue-500 focus:bg-blue-500/10 focus:ring-[3px] focus:ring-blue-500/15" value={form.ward_id} onChange={e => setForm({ ...form, ward_id: e.target.value })}>
                    <option value="">Select Ward</option>
                    {[1,2,3,4,5,6,7,8].map(w => <option key={w} value={w}>Ward {w}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5"><label className="text-[0.82rem] font-semibold text-gray-300 tracking-[0.02em]">Latitude (optional)</label><input type="number" step="any" className="bg-white/5 border border-white/10 rounded-md px-3.5 py-2.5 text-gray-100 text-sm transition-fast w-full focus:outline-none focus:border-blue-500 focus:bg-blue-500/10 focus:ring-[3px] focus:ring-blue-500/15" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} placeholder="16.5131" /></div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-colors bg-gradient-to-br from-green-600 to-green-800 text-white shadow-[0_2px_8px_rgba(67,160,71,0.4)] hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(67,160,71,0.5)] border-none cursor-pointer" disabled={submitting}>
                  <Send size={15} /> {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Verification Modal */}
      {verifyingComplaintId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#1a2535', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>🤖 AI Cleanliness Verification Audit</h3>
              <button onClick={() => setVerifyingComplaintId(null)} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', margin: 0 }}>
                Please provide an image of the cleaned area to verify resolution quality using Google Vision AI auditing.
              </p>

              {/* Presets */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PRESET_IMAGES.map(img => (
                  <button
                    key={img.label}
                    onClick={() => setVerifyImageUrl(img.url)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.72rem] font-semibold transition-colors bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white"
                    type="button"
                  >
                    {img.label}
                  </button>
                ))}
              </div>

              {/* Input field */}
              <div className="flex flex-col gap-1.5" style={{ textAlign: 'left' }}>
                <label className="text-[0.82rem] font-semibold text-gray-300">Resolution Photo URL *</label>
                <input
                  required
                  className="bg-white/5 border border-white/10 rounded-md px-3.5 py-2.5 text-gray-100 text-sm w-full"
                  value={verifyImageUrl}
                  onChange={e => setVerifyImageUrl(e.target.value)}
                  placeholder="https://example.com/clean-street.jpg"
                />
              </div>

              {/* Verify button */}
              <button
                onClick={handleVerifyCleanliness}
                disabled={verifying || !verifyImageUrl.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-colors bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-[0_2px_8px_rgba(30,136,229,0.4)] border-none cursor-pointer"
                type="button"
              >
                {verifying ? 'Analyzing Cleanliness...' : '🔬 Analyze Cleanliness with AI'}
              </button>

              {/* Result display */}
              {auditResult && (
                <div style={{
                  padding: 16,
                  borderRadius: 12,
                  background: auditResult.is_verified_clean ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${auditResult.is_verified_clean ? 'rgba(74,222,128,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: auditResult.is_verified_clean ? '#4ADE80' : '#EF4444' }}>
                      {auditResult.is_verified_clean ? '✓ Cleanliness Verified' : '✗ Audit Warning Issued'}
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>
                      Score: {auditResult.score}/100
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--gray-300)', margin: 0, lineHeight: 1.5 }}>
                    {auditResult.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setVerifyingComplaintId(null)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApproveResolution}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold bg-gradient-to-br from-green-600 to-green-800 text-white shadow-[0_2px_8px_rgba(74,222,128,0.4)] border-none cursor-pointer"
                >
                  Approve & Resolve
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

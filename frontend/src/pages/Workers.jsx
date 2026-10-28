import { useState } from 'react';
import { Users, CheckSquare, TrendingUp, Award, Calendar, BookOpen, DollarSign } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useAPI, usePost } from '../hooks/useAPI';
import { toast } from 'react-toastify';
import api from '../config/api';

const ATTENDANCE_OPTIONS = ['Present', 'Absent', 'Leave', 'Half Day'];
const ATTENDANCE_COLORS = { Present: '#4ADE80', Absent: '#F87171', Leave: '#FCD34D', 'Half Day': '#FB923C' };

export default function Workers() {
  const { data: workers, loading, refetch } = useAPI('/api/workers', { defaultValue: [] });
  const { data: leaderboard } = useAPI('/api/workers/performance', { defaultValue: [] });
  const [filterWard, setFilterWard] = useState('');
  const [updating, setUpdating] = useState(null);

  const [selectedWorker, setSelectedWorker] = useState(null);
  const [activeTab, setActiveTab] = useState('attendance');

  const markAttendance = async (workerId, attendance) => {
    setUpdating(workerId);
    try {
      await api.post('/api/workers/attendance', { worker_id: workerId, attendance });
      toast.success(`Attendance marked: ${attendance}`);
      refetch();
    } catch { toast.error('Failed to update attendance'); }
    finally { setUpdating(null); }
  };

  const filtered = (workers || []).filter(w => !filterWard || w.ward_id === parseInt(filterWard));
  const presentCount = (workers || []).filter(w => w.attendance === 'Present').length;
  const absentCount = (workers || []).filter(w => w.attendance === 'Absent').length;

  const radarData = (leaderboard || []).slice(0, 6).map(w => ({
    worker: w.name.split(' ')[0], score: w.performance_score
  }));

  return (
    <div className="animate-fadeIn">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[1.6rem] font-extrabold text-white mb-1">👷 Worker Management</h2>
          <p className="text-sm text-gray-400">{workers?.length || 0} workers · {presentCount} present · {absentCount} absent</p>
        </div>
        <select className="bg-white/5 border border-white/10 rounded-md px-3.5 py-2.5 text-gray-100 text-sm transition-all w-full focus:outline-none focus:border-blue-500 focus:bg-blue-500/10 focus:ring-[3px] focus:ring-blue-500/15 hover:bg-white/10" style={{ width: 140 }} value={filterWard} onChange={e => setFilterWard(e.target.value)}>
          <option value="">All Wards</option>
          {[1,2,3,4,5,6,7,8].map(w => <option key={w} value={w}>Ward {w}</option>)}
        </select>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Workers', value: workers?.length || 0, color: '#60A5FA', icon: '👷' },
          { label: 'Present Today', value: presentCount, color: '#4ADE80', icon: '✅' },
          { label: 'Absent', value: absentCount, color: '#F87171', icon: '❌' },
          { label: 'Avg Performance', value: `${Math.round((workers || []).reduce((a,w) => a+w.performance_score, 0)/Math.max((workers||[]).length,1))}%`, color: '#FCD34D', icon: '⭐' },
        ].map(c => (
          <div key={c.label} className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all duration-300 hover:border-white/[0.14] hover:shadow-lg hover:-translate-y-1 cursor-default" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.6rem' }}>{c.icon}</span>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Worker Table */}
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all duration-300 hover:border-white/[0.14] hover:shadow-lg" style={{ padding: 20 }}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent" style={{ color: 'var(--foreground)', marginTop: 0 }}>Attendance & Task Tracking</h3>
          {loading ? <div className="flex flex-col items-center justify-center p-15 gap-4 text-gray-400"><div className="w-9 h-9 rounded-full border-4 border-white/10 border-t-blue-500 animate-spin" /></div> : (
            <div className="overflow-x-auto rounded-lg" style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table className="w-full border-collapse text-sm">
                <thead><tr><th>Name</th><th>Ward</th><th>Attendance</th><th>Tasks</th><th>Progress</th></tr></thead>
                <tbody>
                  {filtered.map(w => (
                    <tr key={w.id} className="hover:bg-white/5 cursor-pointer transition-colors duration-200" onClick={() => { setSelectedWorker(w); setActiveTab('attendance'); }}>
                      <td className="py-2 px-2">
                        <div style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '0.875rem' }}>{w.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{w.employee_id} · {w.shift_start}–{w.shift_end}</div>
                      </td>
                      <td className="py-2 px-2"><span style={{ background: 'rgba(30,136,229,0.15)', color: '#60A5FA', padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600 }}>Ward {w.ward_id}</span></td>
                      <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                        <select
                          className="bg-white/5 border border-white/10 rounded-md px-3.5 py-2.5 text-gray-100 text-sm transition-fast w-full focus:outline-none focus:border-blue-500 focus:bg-blue-500/10 focus:ring-[3px] focus:ring-blue-500/15"
                          style={{ fontSize: '0.75rem', padding: '4px 8px', width: 110, color: ATTENDANCE_COLORS[w.attendance] || 'white', background: `${ATTENDANCE_COLORS[w.attendance] || '#6B7280'}20` }}
                          value={w.attendance}
                          onChange={e => markAttendance(w.id, e.target.value)}
                          disabled={updating === w.id}
                        >
                          {ATTENDANCE_OPTIONS.map(a => <option key={a}>{a}</option>)}
                        </select>
                      </td>
                      <td className="py-2 px-2" style={{ fontSize: '0.82rem' }}>{w.tasks_completed}/{w.tasks_total}</td>
                      <td className="py-2 px-2" style={{ minWidth: 100 }}>
                        <div className="progress-bar-wrap" style={{ height: 6 }}>
                          <div className="progress-bar-fill" style={{ width: `${w.performance_score}%`, transition: 'width 1s ease-out' }} />
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--gray-400)', marginTop: 2 }}>{w.performance_score}%</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Leaderboard + Radar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all duration-300 hover:border-white/[0.14] hover:shadow-lg" style={{ padding: 20 }}>
            <h3 className="text-base font-bold mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent" style={{ color: 'var(--foreground)', marginTop: 0 }}>🏆 Performance Leaderboard</h3>
            {leaderboard?.slice(0, 5).map((w, i) => (
              <div key={w.employee_id} className="hover:bg-white/5 p-2 rounded-lg transition-colors cursor-pointer" onClick={() => { setSelectedWorker(w); setActiveTab('performance'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {w.rank}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>{w.name}</div>
                  <div className="progress-bar-wrap" style={{ height: 4, marginTop: 3 }}>
                    <div className="progress-bar-fill" style={{ width: `${w.performance_score}%`, transition: 'width 1s ease-out' }} />
                  </div>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--green-400)' }}>{w.performance_score}%</span>
              </div>
            ))}
          </div>
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all duration-300 hover:border-white/[0.14] hover:shadow-lg" style={{ padding: 20 }}>
            <h3 className="text-base font-bold mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent" style={{ color: 'var(--foreground)', marginTop: 0 }}>Performance Radar</h3>
            <ResponsiveContainer width="100%" height={170}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="worker" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#43A047" fill="#43A047" fillOpacity={0.2} />
                <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Worker Details Modal */}
      {selectedWorker && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-[#1a2535] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
            <button 
              onClick={() => setSelectedWorker(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
            <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
              <div className="w-14 h-14 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl font-bold border border-blue-500/30 shrink-0">
                {selectedWorker.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedWorker.name}</h3>
                <p className="text-sm text-gray-400 font-mono">{selectedWorker.employee_id} · Assigned Ward {selectedWorker.ward_id}</p>
                <div className="text-xs text-blue-300 mt-1">Vehicle: {selectedWorker.assigned_vehicle_id ? `Truck #${selectedWorker.assigned_vehicle_id}` : 'Unassigned'}</div>
              </div>
            </div>
            
            <div className="flex border-b border-white/10 mb-4 overflow-x-auto hide-scrollbar">
              {[
                { id: 'attendance', icon: <CheckSquare size={14}/>, label: 'Attendance' },
                { id: 'leave', icon: <Calendar size={14}/>, label: 'Leave' },
                { id: 'performance', icon: <TrendingUp size={14}/>, label: 'Performance' },
                { id: 'salary', icon: <DollarSign size={14}/>, label: 'Salary' },
                { id: 'training', icon: <BookOpen size={14}/>, label: 'Training' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-4" style={{ minHeight: '200px' }}>
              {activeTab === 'attendance' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Today's Status</p>
                      <span style={{ color: ATTENDANCE_COLORS[selectedWorker.attendance] || 'white', fontWeight: 600 }}>
                        {selectedWorker.attendance}
                      </span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Shift Timing</p>
                      <p className="text-gray-200 font-semibold">{selectedWorker.shift_start} to {selectedWorker.shift_end}</p>
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <h4 className="text-sm font-semibold text-gray-300 mb-3 border-b border-white/10 pb-2">Shift Progress</h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Tasks Completed</span>
                      <span className="text-white font-bold">{selectedWorker.tasks_completed} / {selectedWorker.tasks_total}</span>
                    </div>
                    <div className="progress-bar-wrap" style={{ height: 8 }}>
                      <div className="progress-bar-fill" style={{ width: `${(selectedWorker.tasks_completed/selectedWorker.tasks_total)*100}%` }} />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'leave' && (
                <div className="bg-white/5 p-4 rounded-lg border border-white/5 text-center py-8">
                  <Calendar className="mx-auto text-gray-500 mb-2" size={32} />
                  <p className="text-gray-300 font-semibold">Leave Balance: <span className="text-green-400">{selectedWorker.leave_balance || 12} days</span></p>
                  <button className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm text-white transition-colors">Apply Leave</button>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-300">Overall Score</p>
                    <p className="text-green-400 font-bold text-2xl">{selectedWorker.performance_score}%</p>
                  </div>
                  <ResponsiveContainer width="100%" height={120}>
                    <RadarChart data={[{ worker: selectedWorker.name, score: selectedWorker.performance_score }]}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="worker" tick={false} />
                      <Radar name="Score" dataKey="score" stroke="#43A047" fill="#43A047" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {activeTab === 'salary' && (
                <div className="bg-white/5 p-4 rounded-lg border border-white/5 text-center py-8">
                  <DollarSign className="mx-auto text-green-500 mb-2" size={32} />
                  <p className="text-gray-300 mb-1">Estimated Current Month</p>
                  <p className="text-white text-2xl font-bold">₹12,500</p>
                  <p className="text-xs text-gray-500 mt-2">Includes ₹500 performance bonus</p>
                </div>
              )}

              {activeTab === 'training' && (
                <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg mb-2">
                    <span className="text-sm text-gray-300">Safety & Sanitation Standard</span>
                    <span className="text-xs font-bold text-green-400 px-2 py-1 bg-green-500/20 rounded">Completed</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg">
                    <span className="text-sm text-gray-300">Hazardous Waste Handling</span>
                    <span className="text-xs font-bold text-yellow-400 px-2 py-1 bg-yellow-500/20 rounded">Pending</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedWorker(null)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

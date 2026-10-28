import { useState } from 'react';
import { useAPI } from '../hooks/useAPI';
import api from '../config/api';
import { Shield, ShieldAlert, Users, Server, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

export default function SystemAdmin() {
  const { data: users, refetch: refetchUsers } = useAPI('/api/admin/users', { defaultValue: [] });
  const { data: logs, refetch: refetchLogs } = useAPI('/api/admin/audit-logs?limit=100', { defaultValue: [] });
  const [activeTab, setActiveTab] = useState('users');

  const updateUserRole = async (userId, newRole) => {
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      toast.success('User role updated successfully');
      refetchUsers();
      refetchLogs();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[1.6rem] font-extrabold text-white mb-1 flex items-center gap-2">
            <Shield className="text-purple-400" size={28} /> System Administration
          </h2>
          <p className="text-sm text-gray-400">Manage user roles, permissions, and system audit logs</p>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setActiveTab('users')} style={{
              padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: activeTab === 'users' ? 'rgba(168,85,247,0.4)' : 'transparent',
              color: activeTab === 'users' ? 'white' : 'var(--gray-400)',
              fontWeight: 600, fontSize: '0.82rem', transition: 'var(--transition-fast)',
            }}>
              <Users size={14} className="inline mr-2" /> Users
            </button>
            <button onClick={() => setActiveTab('audit')} style={{
              padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: activeTab === 'audit' ? 'rgba(168,85,247,0.4)' : 'transparent',
              color: activeTab === 'audit' ? 'white' : 'var(--gray-400)',
              fontWeight: 600, fontSize: '0.82rem', transition: 'var(--transition-fast)',
            }}>
              <Server size={14} className="inline mr-2" /> Audit Logs
            </button>
          </div>
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[0.8rem] font-semibold transition-colors bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white" onClick={() => { refetchUsers(); refetchLogs(); }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl p-5 mb-6">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-400" /> User Role Management
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 text-gray-400 font-semibold">ID</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold">Name</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold">Email</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold">Current Role</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold">Change Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-gray-300"><code className="bg-transparent text-purple-400">{u.id}</code></td>
                    <td className="py-3 px-4 text-gray-100 font-semibold">{u.full_name}</td>
                    <td className="py-3 px-4 text-gray-400">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-[0.7rem] font-bold border ${
                        u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        u.role === 'municipal_officer' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        u.role === 'supervisor' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        'bg-green-500/10 text-green-400 border-green-500/20'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select 
                        className="bg-black/50 border border-white/10 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                        value={u.role}
                        onChange={(e) => updateUserRole(u.id, e.target.value)}
                        disabled={u.id === 1} // Prevent changing super admin
                      >
                        <option value="admin">Admin</option>
                        <option value="municipal_officer">Municipal Officer</option>
                        <option value="panchayat_official">Panchayat Official</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="citizen">Citizen</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl p-5 mb-6">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <ShieldAlert size={20} className="text-red-400" /> Security Audit Logs
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 text-gray-400 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold">User</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold">Action</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold">Entity</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-gray-400 text-xs">{format(new Date(log.created_at), 'dd MMM yyyy, HH:mm:ss')}</td>
                    <td className="py-3 px-4 text-gray-200">
                      <div className="font-semibold">{log.user?.full_name}</div>
                      <div className="text-[0.7rem] text-gray-500">{log.user?.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-white/10 text-white text-xs font-mono">{log.action}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-xs">{log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}</td>
                    <td className="py-3 px-4">
                      <pre className="bg-black/40 p-2 rounded text-[0.65rem] text-green-400 font-mono whitespace-pre-wrap max-w-xs overflow-hidden">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">No audit logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

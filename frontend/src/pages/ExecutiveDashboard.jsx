import React from 'react';
import { Star, Truck, MapPin, AlertTriangle, MessageSquare, Users, TrendingUp, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ExecutiveDashboard({ kpis, weeklyChartData, handleRefresh, kpiLoading }) {
  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 4px 0' }}>🏢 Executive Command Center</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0 }}>
            District-wide Swachh Bharat metrics for Municipal Officers
          </p>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[0.8rem] font-semibold transition-colors bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white" onClick={handleRefresh}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {kpiLoading ? (
        <div className="flex flex-col items-center justify-center p-15 gap-4 text-gray-400">
          <div className="w-9 h-9 rounded-full border-4 border-white/10 border-t-blue-500 animate-spin" />
          <span>Loading Executive Data...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20 rounded-xl p-5 relative overflow-hidden">
              <Star className="absolute -right-4 -bottom-4 text-green-500/10" size={100} />
              <h3 className="text-green-400 font-bold mb-1">District Cleanliness</h3>
              <p className="text-3xl font-black text-white">{kpis.cleanliness_score || 95}<span className="text-lg text-gray-400 font-normal">/100</span></p>
              <p className="text-xs text-green-300 mt-2 flex items-center gap-1"><TrendingUp size={12}/> +2.4% from last month</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 rounded-xl p-5 relative overflow-hidden">
              <Truck className="absolute -right-4 -bottom-4 text-blue-500/10" size={100} />
              <h3 className="text-blue-400 font-bold mb-1">Fleet Status</h3>
              <p className="text-3xl font-black text-white">{kpis.active_vehicles || 0}<span className="text-lg text-gray-400 font-normal"> active</span></p>
              <p className="text-xs text-blue-300 mt-2">of {kpis.total_vehicles || 12} total vehicles deployed</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/20 rounded-xl p-5 relative overflow-hidden">
              <MapPin className="absolute -right-4 -bottom-4 text-purple-500/10" size={100} />
              <h3 className="text-purple-400 font-bold mb-1">Best Ward</h3>
              <p className="text-3xl font-black text-white">Ward 3</p>
              <p className="text-xs text-purple-300 mt-2">98% Coverage · 42 Streets</p>
            </div>

            <div className="bg-gradient-to-br from-red-500/20 to-red-600/5 border border-red-500/20 rounded-xl p-5 relative overflow-hidden">
              <AlertTriangle className="absolute -right-4 -bottom-4 text-red-500/10" size={100} />
              <h3 className="text-red-400 font-bold mb-1">Worst Ward</h3>
              <p className="text-3xl font-black text-white">Ward 7</p>
              <p className="text-xs text-red-300 mt-2">65% Coverage · 18 Complaints</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
             <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl p-5">
               <h3 className="text-white font-bold mb-4 flex items-center gap-2"><MessageSquare className="text-orange-400" size={18}/> Complaint Trends</h3>
               <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--foreground)' }} />
                    <Line type="monotone" dataKey="complaints" stroke="#FB923C" strokeWidth={3} dot={{ fill: '#FB923C', r: 4 }} name="Complaints" />
                  </LineChart>
                </ResponsiveContainer>
             </div>
             
             <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl p-5">
               <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Users className="text-blue-400" size={18}/> Attendance Summary</h3>
               <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">Drivers</span><span className="text-white font-bold">12/14 (85%)</span></div>
                    <div className="w-full bg-white/5 h-2 rounded"><div className="bg-blue-400 h-2 rounded" style={{width: '85%'}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">Sanitation Workers</span><span className="text-white font-bold">45/50 (90%)</span></div>
                    <div className="w-full bg-white/5 h-2 rounded"><div className="bg-green-400 h-2 rounded" style={{width: '90%'}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">Supervisors</span><span className="text-white font-bold">4/4 (100%)</span></div>
                    <div className="w-full bg-white/5 h-2 rounded"><div className="bg-purple-400 h-2 rounded" style={{width: '100%'}}></div></div>
                  </div>
               </div>
             </div>
          </div>
        </>
      )}
    </div>
  );
}

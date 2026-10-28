import { useState } from 'react';
import { Map as MapIcon, Home, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

export default function CoverageManagement() {
  const [activeTab, setActiveTab] = useState('daily');
  
  // Mock Data
  const coverageData = {
    totalHouseholds: 4200,
    coveredHouseholds: 3100,
    missedHouseholds: 1100,
    totalStreets: 45,
    coveredStreets: 32,
    missedStreets: 5,
    inProgressStreets: 8
  };

  const wards = [
    { id: 1, name: "Benz Circle Area", coverage: 85 },
    { id: 2, name: "Patamata Block", coverage: 40 },
    { id: 3, name: "Gunadala Heights", coverage: 100 },
  ];

  return (
    <div className="animate-fadeIn p-6">
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h2 className="text-[1.6rem] font-extrabold text-white mb-1">🗺️ Ward & Coverage Management</h2>
          <p className="text-sm text-gray-400">Track street, colony, and household coverage metrics.</p>
        </div>
      </div>

      <div className="flex border-b border-white/10 mb-6 overflow-x-auto hide-scrollbar">
        {[
          { id: 'daily', label: 'Daily Status' },
          { id: 'colonies', label: 'Colonies & Wards' },
          { id: 'history', label: 'Coverage History' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Households Covered", value: `${coverageData.coveredHouseholds}/${coverageData.totalHouseholds}`, color: "#4ADE80", icon: <Home size={20}/> },
              { label: "Streets Completed", value: `${coverageData.coveredStreets}/${coverageData.totalStreets}`, color: "#60A5FA", icon: <CheckCircle2 size={20}/> },
              { label: "Missed Streets", value: coverageData.missedStreets, color: "#F87171", icon: <XCircle size={20}/> },
              { label: "In Progress", value: coverageData.inProgressStreets, color: "#FCD34D", icon: <Clock size={20}/> },
            ].map(card => (
              <div key={card.label} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                <div style={{ color: card.color }}>{card.icon}</div>
                <div>
                  <p className="text-xl font-bold" style={{ color: card.color }}>{card.value}</p>
                  <p className="text-xs text-gray-400 uppercase">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Coverage by Ward</h3>
              <div className="space-y-4">
                {wards.map(ward => (
                  <div key={ward.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300 font-semibold">{ward.name}</span>
                      <span className="text-gray-400">{ward.coverage}%</span>
                    </div>
                    <div className="progress-bar-wrap" style={{ height: 8 }}>
                      <div className="progress-bar-fill bg-blue-500" style={{ width: `${ward.coverage}%`, background: ward.coverage < 50 ? '#F87171' : ward.coverage < 80 ? '#FCD34D' : '#4ADE80' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-red-400"/> Missed Detection</h3>
              <div className="space-y-3">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm font-bold text-red-400">Main Bazar Road</p>
                  <p className="text-xs text-gray-400">Ward 8 · Skipped by Truck #14</p>
                </div>
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm font-bold text-red-400">Temple Street East</p>
                  <p className="text-xs text-gray-400">Ward 2 · Truck broke down</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'colonies' && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center text-gray-400 py-20">
          <MapIcon size={48} className="mx-auto mb-4 opacity-50" />
          <p>Colony mapping and boundary management features will be visualized here.</p>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center text-gray-400 py-20">
          <Clock size={48} className="mx-auto mb-4 opacity-50" />
          <p>Historical coverage calendar goes here.</p>
        </div>
      )}
    </div>
  );
}

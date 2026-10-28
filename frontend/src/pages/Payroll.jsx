import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Payroll() {
  const { token } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/payroll`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch");
      setPayrolls(await res.json());
    } catch (err) {
      toast.error("Error loading payroll records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [token]);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch(`${API_URL}/api/payroll/calculate`, { 
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error("Failed to calculate");
      toast.success("Payroll calculated successfully!");
      fetchPayroll();
    } catch (err) {
      toast.error("Error calculating payroll");
    } finally {
      setIsCalculating(false);
    }
  };

  if (loading && payrolls.length === 0) return <div className="p-10 text-center text-white">Loading Payroll...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Worker Payroll & Incentives</h1>
          <p className="text-gray-400 text-sm mt-1">Calculate and manage monthly wages based on attendance and performance.</p>
        </div>
        <button 
          onClick={handleCalculate} disabled={isCalculating}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-all"
        >
          {isCalculating ? 'Calculating...' : 'Calculate This Month'}
        </button>
      </div>

      <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Current Month Payouts</h2>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Worker ID</th>
                <th>Month</th>
                <th>Days Present</th>
                <th>Base Salary</th>
                <th>Performance Bonus</th>
                <th>Total Payout</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map(p => (
                <tr key={p.id}>
                  <td className="font-medium">Worker #{p.worker_id}</td>
                  <td>{p.month}</td>
                  <td>{p.days_present}</td>
                  <td>₹{p.base_salary.toFixed(2)}</td>
                  <td className="text-green-400">+₹{p.performance_bonus.toFixed(2)}</td>
                  <td className="font-bold">₹{p.total_payout.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${p.status === 'Paid' ? 'badge-active' : 'badge-delayed'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {payrolls.length === 0 && (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">No payroll records for this month. Click Calculate to generate them.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_PAGES = {
  admin:              ['Dashboard', 'Vehicle Tracking', 'Street Coverage', 'Complaints', 'Workers', 'Analytics', 'AI Insights'],
  municipal_officer:  ['Dashboard', 'Vehicle Tracking', 'Street Coverage', 'Complaints', 'Workers', 'Analytics', 'AI Insights'],
  panchayat_official: ['Dashboard', 'Vehicle Tracking', 'Street Coverage', 'Complaints', 'AI Insights'],
  supervisor:         ['Dashboard', 'Vehicle Tracking', 'Street Coverage', 'Complaints', 'Workers', 'AI Insights'],
};

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const allowedPages = ROLE_PAGES[user?.role] || [];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0D1B2A 0%, #1a0d0d 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'rgba(239,68,68,0.05)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 20,
        padding: '44px 40px',
        maxWidth: 480, width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(239,68,68,0.1)',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(239,68,68,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShieldOff size={34} color="#F87171" />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>
          Access Denied
        </h1>
        <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem', marginBottom: 6 }}>
          Your role <strong style={{ color: '#FCD34D' }}>{user?.role?.replace(/_/g, ' ')}</strong> does not
          have permission to view this page.
        </p>

        {allowedPages.length > 0 && (
          <div style={{ margin: '20px 0', textAlign: 'left' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pages you can access:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {allowedPages.map(page => (
                <span key={page} style={{
                  padding: '3px 10px', borderRadius: 99, fontSize: '0.75rem',
                  background: 'rgba(67,160,71,0.12)', color: '#4ADE80',
                  border: '1px solid rgba(67,160,71,0.25)', fontWeight: 500,
                }}>
                  {page}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost"
          >
            <ArrowLeft size={15} /> Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-colors bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-[0_2px_8px_rgba(30,136,229,0.4)] hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(30,136,229,0.5)] border-none cursor-pointer"
          >
            <Home size={15} /> Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

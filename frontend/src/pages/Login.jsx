import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const DEMO_ACCOUNTS = [
  { label: 'Admin',              email: 'admin@swachh.gov.in',      password: 'Admin@123',      color: '#FF8A8A' },
  { label: 'Municipal Officer',  email: 'officer@swachh.gov.in',    password: 'Officer@123',    color: '#93C5FD' },
  { label: 'Panchayat Official', email: 'panchayat@swachh.gov.in',  password: 'Panchayat@123', color: '#6EE7B7' },
  { label: 'Supervisor',         email: 'supervisor@swachh.gov.in', password: 'Super@123',      color: '#FDE047' },
  { label: 'Citizen',            email: 'citizen@swachh.gov.in',    password: 'Citizen@123',    color: '#38BDF8' },
];

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [hoveredDemo, setHoveredDemo] = useState(null);
  const [hoveredCitizen, setHoveredCitizen] = useState(false);
  const [hoveredSubmit, setHoveredSubmit] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      toast.success(`Welcome, ${result.user.full_name}!`);
      navigate('/');
    } else {
      toast.error(result.error);
    }
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundImage: 'url(/bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '24px 24px 24px 8%',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Explicit style overrides to ensure placeholders are clear and auto-fill background remains translucent */}
      <style>{`
        .glass-input::placeholder {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        .glass-input:-webkit-autofill,
        .glass-input:-webkit-autofill:hover, 
        .glass-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.08) inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* Dark overlay for rich contrast under bright sections of bg.png */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.4)', pointerEvents: 'none'
      }} />

      {/* Corporate Glassmorphic Form Card (Horizontal Style) */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.07)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        padding: '32px',
        width: '100%',
        maxWidth: '820px',
        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.45)',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Sleek Header inside the card */}
        <div style={{ marginBottom: '24px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #10b981)',
            fontSize: '1.3rem',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
          }}>
            ♻
          </div>
          <div>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              margin: 0,
              fontFamily: "'Outfit', 'Geist Variable', sans-serif"
            }}>
              Swachh Surveillance
            </h2>
            <p style={{
              fontSize: '0.82rem',
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0
            }}>
              Gram Panchayat Waste Management & Route Compliance Engine
            </p>
          </div>
        </div>

        {/* Horizontal Form Row */}
        <form onSubmit={handleLogin} style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: '16px',
          width: '100%',
          flexWrap: 'wrap'
        }}>
          {/* Email Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '220px' }}>
            <label style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.95)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              textAlign: 'left'
            }}>
              Email / User ID
            </label>
            <input
              type="email"
              required
              className="glass-input"
              placeholder="officer@swachh.gov.in"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={{
                backgroundColor: focusedField === 'email' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                border: focusedField === 'email' ? '1px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '8px',
                padding: '11px 14px',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
                boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(96, 165, 250, 0.25)' : 'none',
                transition: 'all 0.2s ease',
                width: '100%',
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '220px' }}>
            <label style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.95)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              textAlign: 'left'
            }}>
              Password
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPass ? 'text' : 'password'}
                required
                className="glass-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={{
                  backgroundColor: focusedField === 'password' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                  border: focusedField === 'password' ? '1px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.16)',
                  borderRadius: '8px',
                  padding: '11px 42px 11px 14px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(96, 165, 250, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                  width: '100%',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setHoveredSubmit(true)}
            onMouseLeave={() => setHoveredSubmit(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px 20px',
              height: '42px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#ffffff',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: hoveredSubmit ? '0 6px 16px rgba(37, 99, 235, 0.3)' : '0 3px 8px rgba(37, 99, 235, 0.15)',
              transform: hoveredSubmit ? 'translateY(-1px)' : 'none',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              minWidth: '130px'
            }}
          >
            <LogIn size={16} />
            {loading ? 'Signing...' : 'Sign In'}
          </button>
        </form>

        {/* Bottom Section - Demo Accounts & Citizen Link */}
        <div style={{
          marginTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          paddingTop: '18px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          {/* Demo Accounts List */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.72rem',
              color: 'rgba(255, 255, 255, 0.75)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              marginRight: '4px'
            }}>
              Auto-fill:
            </span>
            {DEMO_ACCOUNTS.map(acc => {
              const isHovered = hoveredDemo === acc.email;
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  onMouseEnter={() => setHoveredDemo(acc.email)}
                  onMouseLeave={() => setHoveredDemo(null)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    border: isHovered ? `1px solid ${acc.color}` : `1px solid ${acc.color}30`,
                    color: acc.color,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isHovered ? `0 3px 8px ${acc.color}15` : 'none',
                  }}
                >
                  {acc.label}
                </button>
              );
            })}
          </div>

          {/* Citizen Portal Link */}
          <button
            type="button"
            onClick={() => navigate('/citizen')}
            onMouseEnter={() => setFocusedField('citizen')}
            onMouseLeave={() => setFocusedField(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: focusedField === 'citizen' ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.04)',
              border: focusedField === 'citizen' ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.16)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            📢 Citizen Portal
          </button>
        </div>
      </div>
    </div>
  );
}

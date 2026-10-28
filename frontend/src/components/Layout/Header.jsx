import { useState, useEffect, useRef } from 'react';
import { Bell, Wifi, WifiOff, Sun, Moon, AlertTriangle, Truck, Info, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const PAGE_META = {
  '/':             { title: 'Dashboard',         subtitle: 'Village Waste Management Overview', emoji: '🏘️' },
  '/vehicles':     { title: 'Vehicle Tracking',  subtitle: 'Live GPS tracking of waste collection vehicles', emoji: '🗺️' },
  '/streets':      { title: 'Street Coverage',   subtitle: 'Monitor daily street cleaning progress', emoji: '📍' },
  '/complaints':   { title: 'Complaints',         subtitle: 'Citizen complaint management system', emoji: '🚨' },
  '/workers':      { title: 'Worker Management', subtitle: 'Attendance, routes & performance', emoji: '👷' },
  '/analytics':    { title: 'Analytics',          subtitle: 'Reports, trends & data insights', emoji: '📊' },
  '/ai-insights':  { title: 'AI Insights',        subtitle: 'Gemini AI-powered waste management recommendations', emoji: '🤖' },
  '/unauthorized': { title: 'Access Denied',      subtitle: 'You do not have permission to view this page', emoji: '🔒' },
};

export default function Header({ wsConnected, notifCount = 0 }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const meta = PAGE_META[pathname] || PAGE_META['/'];

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // Mock notifications for Phase 1
  const mockNotifications = [
    { id: 1, type: 'alert', title: 'Truck Offline', message: 'Vehicle AP16-TJ-2001 lost GPS signal.', time: '2m ago', icon: <WifiOff size={14} className="text-red-400" />, read: false },
    { id: 2, type: 'complaint', title: 'New Complaint', message: 'Overflowing bin reported in Ward 3.', time: '15m ago', icon: <AlertTriangle size={14} className="text-yellow-400" />, read: false },
    { id: 3, type: 'info', title: 'Route Update', message: 'Driver Srinivas Rao completed Ward 1 route.', time: '1h ago', icon: <CheckCircle2 size={14} className="text-green-400" />, read: true },
  ];

  const unreadCount = mockNotifications.filter(n => !n.read).length;
  const displayCount = notifCount > 0 ? notifCount : unreadCount;

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header style={{
      height: 64,
      background: 'var(--header-bg)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--header-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 50,
      transition: 'background var(--transition-normal), border var(--transition-normal)',
    }}>
      {/* Page Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{meta.emoji}</span> {meta.title}
        </h1>
        <p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {meta.subtitle}
        </p>
      </div>

      {/* Date */}
      <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', fontWeight: 500, flexShrink: 0 }}>
        {format(new Date(), 'dd MMM yyyy, EEEE')}
      </div>

      {/* WS Status pill */}
      <div 
        className={wsConnected ? 'ws-live-pulse-green' : 'ws-live-pulse-red'}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 99,
          background: wsConnected ? 'rgba(67,160,71,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${wsConnected ? 'rgba(67,160,71,0.3)' : 'rgba(239,68,68,0.3)'}`,
          fontSize: '0.7rem', fontWeight: 700,
          color: wsConnected ? '#22c55e' : '#F87171',
          flexShrink: 0,
        }}
      >
        {wsConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
        {wsConnected ? 'Live' : 'Offline'}
      </div>

      {/* Theme Toggle */}
      <button 
        onClick={() => setIsDark(d => !d)}
        style={{
          position: 'relative', background: 'var(--card)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
          padding: '7px', cursor: 'pointer', color: 'var(--foreground)',
          display: 'flex', transition: 'var(--transition-fast)',
          flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        {isDark ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {/* Notifications */}
      <div style={{ position: 'relative' }} ref={notifRef}>
        <button style={{
          position: 'relative', background: 'var(--card)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
          padding: '7px', cursor: 'pointer', color: 'var(--foreground)',
          display: 'flex', transition: 'var(--transition-fast)',
          flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell size={17} />
          {displayCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              background: 'var(--danger)', color: 'white',
              width: 16, height: 16, borderRadius: '50%',
              fontSize: '0.6rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {displayCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 soft-glass rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
            <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-card/40">
              <h3 className="font-bold text-sm text-foreground">Notifications</h3>
              <button className="text-xs text-primary hover:text-primary/80 font-semibold">Mark all as read</button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {mockNotifications.map(notif => (
                <div key={notif.id} className={`p-4 border-b border-border/40 flex gap-3 hover:bg-card/30 transition-colors cursor-pointer ${notif.read ? 'opacity-60' : 'bg-primary/5'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notif.type === 'alert' ? 'bg-red-500/20 text-red-500' : 
                    notif.type === 'complaint' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'
                  }`}>
                    {notif.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground mb-0.5">{notif.title}</h4>
                    <p className="text-[0.7rem] text-muted-foreground leading-snug mb-1">{notif.message}</p>
                    <span className="text-[0.65rem] text-muted-foreground/75 font-semibold">{notif.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-border bg-card/40">
              <button className="w-full py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                View All Notifications
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--blue-700), var(--green-700))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, color: 'white', fontSize: '0.78rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)', cursor: 'pointer', flexShrink: 0,
        }}>
          {user?.avatar_initials || '?'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.1 }}>
            {user?.full_name?.split(' ')[0] || 'User'}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>
            {user?.role?.replace('_', ' ')}
          </span>
        </div>
      </div>
    </header>
  );
}

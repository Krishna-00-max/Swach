import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Truck, MapPin, MessageSquare,
  Users, BarChart3, Brain, ChevronLeft,
  ChevronRight, LogOut, Shield, Lock, Settings, CreditCard,
  AlertTriangle, CheckCircle, Route, FolderOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ─── Role Matrix (mirrors App.jsx ROUTE_ROLES) ─────────────────────────────
// 'all' = every authenticated role sees this nav item
const NAV_ITEMS = [
  {
    path: '/',
    icon: LayoutDashboard,
    label: 'Dashboard',
    roles: ['admin', 'municipal_officer', 'panchayat_official', 'supervisor', 'citizen'],
    desc: 'KPIs & overview',
  },
  {
    path: '/vehicles',
    icon: Truck,
    label: 'Vehicle Tracking',
    roles: ['admin', 'municipal_officer', 'panchayat_official', 'supervisor', 'citizen'],
    desc: 'Live GPS map',
  },
  {
    path: '/coverage',
    icon: MapPin,
    label: 'Ward Coverage',
    roles: ['admin', 'municipal_officer', 'panchayat_official', 'supervisor'],
    desc: 'Coverage monitoring',
  },
  {
    path: '/complaints',
    icon: MessageSquare,
    label: 'Complaints',
    roles: ['admin', 'municipal_officer', 'panchayat_official', 'supervisor'],
    desc: 'Citizen complaints',
  },
  {
    path: '/workers',
    icon: Users,
    label: 'Workers',
    roles: ['admin', 'municipal_officer', 'supervisor'],
    desc: 'Attendance & tasks',
  },
  {
    path: '/report-issue',
    icon: AlertTriangle,
    label: 'Report Issue',
    roles: ['citizen'],
    desc: 'Submit a new complaint',
  },
  {
    path: '/track-issue',
    icon: CheckCircle,
    label: 'Track Issue',
    roles: ['citizen'],
    desc: 'Check complaint status',
  },
  {
    path: '/analytics',
    icon: BarChart3,
    label: 'Analytics',
    roles: ['admin', 'municipal_officer'],
    desc: 'Reports & trends',
  },
  {
    path: '/ai-insights',
    icon: Brain,
    label: 'AI Insights',
    roles: ['admin', 'municipal_officer', 'panchayat_official', 'supervisor'],
    desc: 'Gemini recommendations',
  },
  {
    path: '/fleet',
    icon: Settings,
    label: 'Fleet & Inventory',
    roles: ['admin', 'municipal_officer'],
    desc: 'Vehicle health & bins',
  },
  {
    path: '/routes',
    icon: Route,
    label: 'Route Planning',
    roles: ['admin', 'municipal_officer', 'supervisor'],
    desc: 'Daily trip assignments',
  },
  {
    path: '/documents',
    icon: FolderOpen,
    label: 'Document Center',
    roles: ['admin', 'municipal_officer', 'supervisor'],
    desc: 'RC, KYC, & Evidence',
  },
  {
    path: '/payroll',
    icon: CreditCard,
    label: 'Payroll',
    roles: ['admin', 'municipal_officer'],
    desc: 'Worker wages & bonus',
  },
  {
    path: '/admin',
    icon: Shield,
    label: 'System Admin',
    roles: ['admin'],
    desc: 'Security & roles',
  },
];

// ─── Role display config ───────────────────────────────────────────────────
const ROLE_CONFIG = {
  admin:              { label: 'Admin',               color: '#F87171', bg: 'rgba(239,68,68,0.15)' },
  municipal_officer:  { label: 'Municipal Officer',   color: '#60A5FA', bg: 'rgba(30,136,229,0.15)' },
  panchayat_official: { label: 'Panchayat Official', color: '#4ADE80', bg: 'rgba(67,160,71,0.15)' },
  supervisor:         { label: 'Supervisor',          color: '#FCD34D', bg: 'rgba(245,158,11,0.15)' },
  citizen:            { label: 'Citizen',             color: '#38BDF8', bg: 'rgba(56,189,248,0.15)' },
};

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const roleConf = ROLE_CONFIG[user?.role] ?? ROLE_CONFIG.supervisor;

  const canAccess = (roles) => {
    if (roles === 'all') return true;
    return Array.isArray(roles) && roles.includes(user?.role);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter(item => canAccess(item.roles));
  const hiddenCount = NAV_ITEMS.length - visibleItems.length;

  return (
    <aside
      style={{
        width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
        background: 'linear-gradient(180deg, var(--sidebar-gradient-start) 0%, var(--sidebar-gradient-end) 100%)',
        display: 'flex', flexDirection: 'column',
        transition: 'width var(--transition-normal), background var(--transition-normal)',
        overflow: 'hidden',
        boxShadow: '4px 0 28px rgba(0,0,0,0.25)',
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div style={{
        padding: '18px 14px',
        borderBottom: '1px solid var(--sidebar-border)',
        display: 'flex', alignItems: 'center', gap: 10, minHeight: 68,
        flexShrink: 0,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem',
        }}>♻</div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--sidebar-text)', whiteSpace: 'nowrap' }}>
              Swachh Surveillance
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--sidebar-text)', opacity: 0.6, whiteSpace: 'nowrap' }}>
              Gram Panchayat Portal
            </div>
          </div>
        )}
      </div>

      {/* ── User card ────────────────────────────────────────── */}
      {!collapsed && (
        <div style={{
          margin: '10px 10px 4px',
          padding: '10px 12px',
          background: 'var(--sidebar-card-bg)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--sidebar-border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: roleConf.bg, border: `1.5px solid ${roleConf.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, color: roleConf.color, fontSize: '0.8rem',
            }}>
              {user?.avatar_initials || '?'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{
                fontWeight: 600, fontSize: '0.8rem', color: 'var(--sidebar-text)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.full_name || 'Unknown'}
              </div>
              {/* Role badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                marginTop: 3, padding: '2px 7px', borderRadius: 99,
                background: roleConf.bg, border: `1px solid ${roleConf.color}30`,
              }}>
                <Shield size={9} color={roleConf.color} />
                <span style={{ fontSize: '0.62rem', color: roleConf.color, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {roleConf.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Nav items ────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {visibleItems.map(({ path, icon: Icon, label, desc }) => (
          <NavLink key={path} to={path} end={path === '/'} style={{ textDecoration: 'none', display: 'block' }}>
            {({ isActive }) => (
              <div
                title={collapsed ? label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: collapsed ? '11px' : '9px 11px',
                  borderRadius: 'var(--radius-md)', marginBottom: 2,
                  background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text-inactive)',
                  transition: 'transform 0.2s ease, background var(--transition-fast)', cursor: 'pointer',
                  borderLeft: isActive ? '3px solid var(--sidebar-active-border)' : '3px solid transparent',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={e => { 
                  if (!isActive) e.currentTarget.style.background = 'var(--sidebar-hover-bg)'; 
                  if (!collapsed) e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={e => { 
                  if (!isActive) e.currentTarget.style.background = 'transparent'; 
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <Icon size={19} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.845rem', fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap' }}>
                      {label}
                    </div>
                    {!isActive && (
                      <div style={{ fontSize: '0.62rem', color: 'var(--sidebar-desc-color)', whiteSpace: 'nowrap' }}>
                        {desc}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </NavLink>
        ))}

        {/* ── Locked items (role hint) ── */}
        {!collapsed && hiddenCount > 0 && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--sidebar-border)' }}>
            {NAV_ITEMS.filter(item => !canAccess(item.roles)).map(({ label, icon: Icon }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 11px', borderRadius: 'var(--radius-md)', marginBottom: 2,
                color: 'var(--sidebar-locked-color)', cursor: 'not-allowed',
              }}>
                <Icon size={17} />
                <span style={{ fontSize: '0.82rem' }}>{label}</span>
                <Lock size={11} style={{ marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* ── Bottom actions ───────────────────────────────────── */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--sidebar-border)', flexShrink: 0 }}>
        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '10px' : '9px 12px',
            borderRadius: 'var(--radius-md)', marginBottom: 6,
            background: 'rgba(239,68,68,0.12)', color: '#F87171',
            border: '1px solid rgba(239,68,68,0.22)', cursor: 'pointer',
            width: '100%', transition: 'var(--transition-fast)',
            fontSize: '0.845rem', fontWeight: 600,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.22)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
        >
          <LogOut size={17} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', padding: '7px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--sidebar-card-bg)', color: 'var(--sidebar-text-inactive)',
            border: '1px solid var(--sidebar-border)',
            cursor: 'pointer', transition: 'var(--transition-fast)', fontSize: '0.75rem',
          }}
        >
          {collapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} />{' '}</>}
        </button>
      </div>
    </aside>
  );
}

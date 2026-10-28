import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useVehicleWS } from '../../hooks/useVehicleWS';

// AppLayout owns the WS connection — only mounted when user is authenticated
export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { vehicles, connected, alerts, dismissAlert } = useVehicleWS();

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div
        className={`main-content${collapsed ? ' sidebar-collapsed' : ''}`}
        style={{
          marginLeft: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
          transition: 'margin-left var(--transition-normal)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Header wsConnected={connected} alertCount={alerts.length} />
        <main className="page-body">
          <Outlet context={{ vehicles, wsConnected: connected, alerts, dismissAlert }} />
        </main>
      </div>
    </div>
  );
}


import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VehicleTracking from './pages/VehicleTracking';
import CoverageManagement from './pages/CoverageManagement';
import Complaints from './pages/Complaints';
import Workers from './pages/Workers';
import Analytics from './pages/Analytics';
import AIInsights from './pages/AIInsights';
import Unauthorized from './pages/Unauthorized';
import FleetManagement from './pages/FleetManagement';
import Payroll from './pages/Payroll';
import DriverGPS from './pages/DriverGPS';
import ReportIssue from './pages/ReportIssue';
import TrackIssue from './pages/TrackIssue';
import SystemAdmin from './pages/SystemAdmin';
import RoutePlanning from './pages/RoutePlanning';
import DocumentCenter from './pages/DocumentCenter';

// ─── Role definitions (single source of truth) ───────────────────────────────
export const ROLES = {
  ADMIN:     'admin',
  OFFICER:   'municipal_officer',
  PANCHAYAT: 'panchayat_official',
  SUPERVISOR:'supervisor',
  CITIZEN:   'citizen',
};

// Which roles can access each route
const ROUTE_ROLES = {
  '/':            ['admin', 'municipal_officer', 'panchayat_official', 'supervisor', 'citizen'],
  '/vehicles':    ['admin', 'municipal_officer', 'panchayat_official', 'supervisor', 'citizen'],
  '/coverage':    ['admin', 'municipal_officer', 'panchayat_official', 'supervisor'],
  '/complaints':  ['admin', 'municipal_officer', 'panchayat_official', 'supervisor'],
  '/workers':     ['admin', 'municipal_officer', 'supervisor'],
  '/analytics':   ['admin', 'municipal_officer'],
  '/ai-insights': ['admin', 'municipal_officer', 'panchayat_official', 'supervisor'],
  '/fleet':       ['admin', 'municipal_officer'],
  '/documents':   ['admin', 'municipal_officer', 'supervisor'],
  '/routes':      ['admin', 'municipal_officer', 'supervisor'],
  '/payroll':     ['admin', 'municipal_officer'],
  '/report-issue':['citizen'],
  '/track-issue': ['citizen'],
  '/admin':       ['admin'],
};

// ─── Guards ───────────────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}

// ─── Routes ───────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/driver" element={<DriverGPS />} />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* All roles */}
        <Route index element={<Dashboard />} />
        <Route
          path="vehicles"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLES['/vehicles']}>
              <VehicleTracking />
            </RoleRoute>
          }
        />
        <Route
          path="coverage"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLES['/coverage']}>
              <CoverageManagement />
            </RoleRoute>
          }
        />
        <Route
          path="complaints"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLES['/complaints']}>
              <Complaints />
            </RoleRoute>
          }
        />
        <Route
          path="ai-insights"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLES['/ai-insights']}>
              <AIInsights />
            </RoleRoute>
          }
        />

        {/* Supervisor + Officer + Admin only */}
        <Route
          path="workers"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLES['/workers']}>
              <Workers />
            </RoleRoute>
          }
        />

        {/* Officer + Admin only */}
        <Route
          path="analytics"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLES['/analytics']}>
              <Analytics />
            </RoleRoute>
          }
        />
        <Route
          path="fleet"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLES['/fleet']}>
              <FleetManagement />
            </RoleRoute>
          }
        />
        <Route
          path="routes"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLES['/routes']}>
              <RoutePlanning />
            </RoleRoute>
          }
        />
        <Route
          path="documents"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLES['/documents']}>
              <DocumentCenter />
            </RoleRoute>
          }
        />
        <Route
          path="payroll"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLES['/payroll']}>
              <Payroll />
            </RoleRoute>
          }
        />
        <Route
          path="admin"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLES['/admin']}>
              <SystemAdmin />
            </RoleRoute>
          }
        />

        {/* Citizen only */}
        <Route
          path="report-issue"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLES['/report-issue']}>
              <ReportIssue />
            </RoleRoute>
          }
        />
        <Route
          path="track-issue"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLES['/track-issue']}>
              <TrackIssue />
            </RoleRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          theme="dark"
          toastStyle={{
            background: '#1a2535',
            color: '#F3F4F6',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            fontSize: '0.875rem',
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

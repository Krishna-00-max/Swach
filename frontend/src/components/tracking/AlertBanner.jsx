/**
 * AlertBanner — Stacking real-time alert notifications.
 * Appears as bottom-right banners, auto-dismiss after 8 seconds.
 * Types: SPEEDING (red), OFF_ROUTE (orange), IDLE (yellow), LOW_FUEL (purple)
 */
import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Gauge, MapPinOff, Clock, Fuel, X } from 'lucide-react';

const ALERT_CONFIG = {
  SPEEDING: {
    icon: Gauge,
    bg: 'rgba(239,68,68,0.12)',
    border: '#EF4444',
    text: '#FCA5A5',
    badge: 'bg-red-500',
    label: 'SPEEDING',
  },
  OFF_ROUTE: {
    icon: MapPinOff,
    bg: 'rgba(249,115,22,0.12)',
    border: '#F97316',
    text: '#FDBA74',
    badge: 'bg-orange-500',
    label: 'OFF ROUTE',
  },
  IDLE: {
    icon: Clock,
    bg: 'rgba(234,179,8,0.12)',
    border: '#EAB308',
    text: '#FDE047',
    badge: 'bg-yellow-500',
    label: 'IDLE',
  },
  LOW_FUEL: {
    icon: Fuel,
    bg: 'rgba(168,85,247,0.12)',
    border: '#A855F7',
    text: '#D8B4FE',
    badge: 'bg-purple-500',
    label: 'LOW FUEL',
  },
};

export function useAlerts() {
  const [alerts, setAlerts] = useState([]);

  const addAlert = useCallback((alert) => {
    const id = `${alert.type}-${alert.vehicle_id}-${Date.now()}`;
    setAlerts((prev) => {
      // Deduplicate: skip if same type+vehicle already visible
      const exists = prev.some(
        (a) => a.type === alert.type && a.vehicle_id === alert.vehicle_id
      );
      if (exists) return prev;
      const newAlert = { ...alert, id };
      return [newAlert, ...prev].slice(0, 5); // max 5 stacked
    });
    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 8000);
  }, []);

  const dismiss = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { alerts, addAlert, dismiss };
}

export default function AlertBanner({ alerts, onDismiss }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none">
      {alerts.map((alert) => {
        const cfg = ALERT_CONFIG[alert.type] || ALERT_CONFIG.OFF_ROUTE;
        const Icon = cfg.icon;
        return (
          <div
            key={alert.id}
            className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl backdrop-blur-md shadow-2xl border min-w-[300px] max-w-[380px]"
            style={{
              background: cfg.bg,
              borderColor: cfg.border,
              animation: 'slideInRight 0.3s ease',
            }}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.badge}`}
            >
              <Icon size={12} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-[0.6rem] font-black tracking-widest uppercase px-1.5 py-0.5 rounded"
                  style={{ background: cfg.border + '30', color: cfg.text }}
                >
                  {cfg.label}
                </span>
              </div>
              <p className="text-[0.78rem] text-gray-200 font-medium leading-tight">
                {alert.message}
              </p>
            </div>
            <button
              onClick={() => onDismiss(alert.id)}
              className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors mt-0.5"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/**
 * useVehicleWS — Extended WebSocket hook
 * Handles initial load, vehicle_update, vehicle_gps_update, alert messages.
 * Provides smooth position interpolation via requestAnimationFrame.
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import { WS_URL } from '../config/api';

// Linear interpolation between two numbers
const lerp = (a, b, t) => a + (b - a) * t;

// Smooth angle interpolation (handles 0/360 wrap-around)
const lerpAngle = (a, b, t) => {
  let diff = b - a;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return (a + diff * t + 360) % 360;
};

const INTERP_DURATION_MS = 2000; // 2 seconds to smoothly move to new position

export const useVehicleWS = () => {
  const [vehicles, setVehicles] = useState([]);
  const [connected, setConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const mountedRef = useRef(true);

  // Target positions for interpolation: { [vehicleId]: { targetLat, targetLng, targetHeading, startLat, startLng, startHeading, startTime } }
  const interpRef = useRef({});
  const animFrameRef = useRef(null);

  // Add an alert (with deduplication and auto-dismiss)
  const addAlert = useCallback((alert) => {
    const id = `${alert.type}-${alert.vehicle_id}-${Date.now()}`;
    setAlerts((prev) => {
      const exists = prev.some(
        (a) => a.type === alert.type && a.vehicle_id === alert.vehicle_id
      );
      if (exists) return prev;
      return [{ ...alert, id }, ...prev].slice(0, 5);
    });
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 8000);
    return id;
  }, []);

  const dismissAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Smooth animation loop — interpolates displayed positions toward targets
  const runInterpolation = useCallback(() => {
    const now = Date.now();
    let hasTargets = false;

    setVehicles((prev) => {
      let changed = false;
      const next = prev.map((v) => {
        const interp = interpRef.current[v.id];
        if (!interp) return v;

        const elapsed = now - interp.startTime;
        const t = Math.min(elapsed / INTERP_DURATION_MS, 1.0);
        const easedT = t < 1 ? 1 - Math.pow(1 - t, 3) : 1; // cubic ease-out

        const newLat = lerp(interp.startLat, interp.targetLat, easedT);
        const newLng = lerp(interp.startLng, interp.targetLng, easedT);
        const newHeading = lerpAngle(interp.startHeading, interp.targetHeading, easedT);

        if (t < 1) hasTargets = true;

        // Only update if position actually changed meaningfully
        if (
          Math.abs(newLat - v.lat) > 0.000001 ||
          Math.abs(newLng - v.lng) > 0.000001 ||
          Math.abs(newHeading - (v.heading || 0)) > 0.5
        ) {
          changed = true;
          return { ...v, lat: newLat, lng: newLng, heading: newHeading };
        }
        return v;
      });
      return changed ? next : prev;
    });

    if (hasTargets) {
      animFrameRef.current = requestAnimationFrame(runInterpolation);
    }
  }, []);

  // Queue a smooth move for a vehicle
  const queueInterpolation = useCallback((vehicleId, fromLat, fromLng, fromHeading, toLat, toLng, toHeading) => {
    interpRef.current[vehicleId] = {
      startLat: fromLat,
      startLng: fromLng,
      startHeading: fromHeading || 0,
      targetLat: toLat,
      targetLng: toLng,
      targetHeading: toHeading || 0,
      startTime: Date.now(),
    };
    // Start animation loop if not running
    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(runInterpolation);
    }
  }, [runInterpolation]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const token = localStorage.getItem('swachh_token');
    const ws = new WebSocket(`${WS_URL}/ws/vehicles${token ? `?token=${encodeURIComponent(token)}` : ''}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (mountedRef.current) setConnected(true);
      console.log('[WS] Connected to vehicle tracker');
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'initial') {
          setVehicles(msg.vehicles || []);

        } else if (msg.type === 'vehicle_update') {
          // REST-patch update — no smooth interpolation needed
          setVehicles((prev) =>
            prev.map((v) => v.id === msg.vehicle.id ? { ...v, ...msg.vehicle } : v)
          );

        } else if (msg.type === 'vehicle_gps_update') {
          // Live GPS — smooth interpolation
          const update = msg.vehicle;
          setVehicles((prev) => {
            return prev.map((v) => {
              if (v.id !== update.id) return v;
              // Queue smooth move from current displayed position to new target
              queueInterpolation(
                v.id,
                v.lat, v.lng, v.heading || 0,
                update.lat, update.lng, update.heading || 0
              );
              // Immediately apply non-position fields
              return {
                ...v,
                ...update,
                lat: v.lat,           // keep current (interpolation will move it)
                lng: v.lng,
                heading: v.heading,
              };
            });
          });

        } else if (msg.type === 'alert') {
          addAlert(msg.alert);
        }
      } catch (e) {
        console.warn('[WS] Parse error:', e);
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      reconnectRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [addAlert, queueInterpolation]);

  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    const pingInterval = setInterval(sendPing, 25000);
    return () => {
      mountedRef.current = false;
      clearInterval(pingInterval);
      clearTimeout(reconnectRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      wsRef.current?.close();
    };
  }, [connect, sendPing]);

  return { vehicles, connected, alerts, addAlert, dismissAlert };
};

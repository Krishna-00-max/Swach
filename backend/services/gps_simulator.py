"""
GPS Simulator — Background async task
Moves vehicles along realistic AP street waypoints every 3 seconds.
Computes compliance, heading, and behavior score, then broadcasts via WebSocket.
"""
import asyncio
import math
import random
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, update
from backend.database import AsyncSessionLocal
from backend.models.vehicle import Vehicle, VehicleStatus
from backend.models.street import Street
from backend.services.route_compliance import (
    compute_heading,
    check_on_route,
    compute_behavior_score,
    classify_alert,
)

# ─── Andhra Pradesh street waypoint grids ────────────────────────────────────
# Each ward has a set of lat/lng waypoints that vehicles circuit around.
# Coordinates are around Vijayawada / Amaravati, AP.
WARD_WAYPOINTS = {
    1: [  # Benz Circle Area
        (16.5062, 80.6480), (16.5074, 80.6512), (16.5082, 80.6540),
        (16.5068, 80.6560), (16.5048, 80.6545), (16.5035, 80.6510),
    ],
    2: [  # Patamata Block
        (16.5120, 80.6380), (16.5135, 80.6410), (16.5148, 80.6440),
        (16.5130, 80.6460), (16.5108, 80.6445), (16.5095, 80.6408),
    ],
    3: [  # Gunadala Heights
        (16.5200, 80.6320), (16.5218, 80.6350), (16.5230, 80.6380),
        (16.5210, 80.6400), (16.5190, 80.6390), (16.5178, 80.6355),
    ],
    4: [  # Moghalrajpuram Hills
        (16.5280, 80.6280), (16.5295, 80.6308), (16.5310, 80.6330),
        (16.5298, 80.6355), (16.5272, 80.6348), (16.5260, 80.6315),
    ],
    5: [  # Governorpet Center
        (16.5150, 80.6240), (16.5165, 80.6268), (16.5182, 80.6292),
        (16.5170, 80.6318), (16.5145, 80.6308), (16.5130, 80.6272),
    ],
    6: [  # Vidyadharapuram Zone
        (16.5050, 80.6150), (16.5068, 80.6178), (16.5085, 80.6200),
        (16.5072, 80.6225), (16.5048, 80.6215), (16.5032, 80.6180),
    ],
    7: [  # Bhavanipuram Sector
        (16.4980, 80.6100), (16.4998, 80.6130), (16.5012, 80.6158),
        (16.4995, 80.6180), (16.4972, 80.6168), (16.4958, 80.6132),
    ],
    8: [  # One Town Old Bazar
        (16.5080, 80.6050), (16.5098, 80.6078), (16.5112, 80.6105),
        (16.5095, 80.6128), (16.5070, 80.6115), (16.5055, 80.6080),
    ],
}

# Internal state: track which waypoint index each vehicle is at
_vehicle_waypoint_idx: dict[int, int] = {}
_vehicle_idle_seconds: dict[int, int] = {}
_last_sent_alerts: dict[int, dict] = {}

# Global simulator task reference
_simulator_task: Optional[asyncio.Task] = None


def _interpolate(a: tuple, b: tuple, t: float) -> tuple:
    """Linear interpolation between two (lat, lng) points."""
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


async def _simulate_tick():
    """Single simulation tick: update all active vehicles."""
    # Import here to avoid circular imports
    from backend.websocket.vehicle_ws import manager, broadcast_vehicle_update

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Vehicle).where(
                Vehicle.status.in_([VehicleStatus.active, VehicleStatus.delayed])
            )
        )
        vehicles = result.scalars().all()

        # Also get all street points for compliance checking
        streets_result = await db.execute(select(Street))
        all_streets = streets_result.scalars().all()
        street_points_by_ward: dict[int, list] = {}
        for s in all_streets:
            wid = s.ward_id
            if wid not in street_points_by_ward:
                street_points_by_ward[wid] = []
            if s.lat and s.lng:
                street_points_by_ward[wid].append({"lat": s.lat, "lng": s.lng})

        updates = []
        for v in vehicles:
            # Skip simulating if the vehicle is being actively tracked by a real phone GPS (updated in the last 15 seconds)
            if v.last_updated:
                last_updated = v.last_updated.replace(tzinfo=timezone.utc) if v.last_updated.tzinfo is None else v.last_updated
                if (datetime.now(timezone.utc) - last_updated).total_seconds() < 15:
                    continue

            ward_id = v.ward_id or (((v.id - 1) % 8) + 1)
            waypoints = WARD_WAYPOINTS.get(ward_id, WARD_WAYPOINTS[1])
            n = len(waypoints)

            # Initialise index if first time
            if v.id not in _vehicle_waypoint_idx:
                _vehicle_waypoint_idx[v.id] = random.randint(0, n - 1)

            idx = _vehicle_waypoint_idx[v.id]
            next_idx = (idx + 1) % n
            target = waypoints[next_idx]
            current = (v.lat or waypoints[idx][0], v.lng or waypoints[idx][1])

            # Calculate distance to target
            dist_to_target = math.sqrt(
                (target[0] - current[0]) ** 2 + (target[1] - current[1]) ** 2
            ) * 111_000  # rough meters

            # Step size based on status (active moves faster)
            step_factor = random.uniform(0.08, 0.15) if v.status == VehicleStatus.active else random.uniform(0.02, 0.06)

            # Move toward target
            new_lat = current[0] + (target[0] - current[0]) * step_factor
            new_lng = current[1] + (target[1] - current[1]) * step_factor

            # If very close to target, advance to next waypoint
            if dist_to_target < 20:
                _vehicle_waypoint_idx[v.id] = next_idx
                new_lat, new_lng = target

            # Compute heading
            heading = compute_heading(current[0], current[1], new_lat, new_lng)

            # Compute speed (m/s → km/h based on movement magnitude)
            moved_m = math.sqrt((new_lat - current[0]) ** 2 + (new_lng - current[1]) ** 2) * 111_000
            # 3-second tick, so actual speed
            speed_kmh = (moved_m / 3.0) * 3.6
            # Scale to realistic range (5-30 for active, 2-8 for delayed)
            if v.status == VehicleStatus.active:
                speed_kmh = min(max(speed_kmh * 120, 8.0), 35.0)
            else:
                speed_kmh = min(max(speed_kmh * 60, 2.0), 12.0)

            # Add slight random variation
            speed_kmh += random.uniform(-2, 2)
            speed_kmh = max(0.0, speed_kmh)

            # On-route compliance
            from backend.services.gis_service import check_vehicle_on_route
            postgis_on_route = await check_vehicle_on_route(db, new_lat, new_lng, ward_id, threshold_m=80.0)
            
            if postgis_on_route is not None:
                on_route = postgis_on_route
            else:
                # Fallback to local CPU calculations
                ward_streets = street_points_by_ward.get(ward_id, [])
                on_route = True
                if ward_streets:
                    on_route = check_on_route(new_lat, new_lng, ward_streets, threshold_m=80.0)

            # Idle tracking
            idle_secs = _vehicle_idle_seconds.get(v.id, 0)
            if speed_kmh < 2.0:
                idle_secs += 3
            else:
                idle_secs = 0
            _vehicle_idle_seconds[v.id] = idle_secs

            # Behavior score
            new_score = compute_behavior_score(
                on_route=on_route,
                speed=speed_kmh,
                fuel_level=v.fuel_level or 80,
                current_score=v.behavior_score or 85.0,
            )

            # Route history (cap at 30 points)
            history = list(v.route_history or [])
            history.append({
                "lat": round(new_lat, 6),
                "lng": round(new_lng, 6),
                "ts": datetime.now(timezone.utc).isoformat(),
                "on_route": on_route,
                "speed": round(speed_kmh, 1),
            })
            history = history[-30:]

            # Fuel drain (very slowly)
            new_fuel = max(5, (v.fuel_level or 80) - random.uniform(0, 0.05))

            update_data = {
                "lat": round(new_lat, 6),
                "lng": round(new_lng, 6),
                "heading": round(heading, 1),
                "speed": round(speed_kmh, 1),
                "on_route": on_route,
                "behavior_score": new_score,
                "route_history": history,
                "fuel_level": int(new_fuel),
            }
            await db.execute(update(Vehicle).where(Vehicle.id == v.id).values(**update_data))

            # Check for alerts
            alert = classify_alert(v.id, v.vehicle_number, speed_kmh, on_route, idle_secs)
            alert_to_send = None
            if alert:
                alert_type = alert.get("type")
                now_ts = datetime.now(timezone.utc).timestamp()
                prev_alert = _last_sent_alerts.get(v.id)
                if not prev_alert or prev_alert["type"] != alert_type or (now_ts - prev_alert["timestamp"] >= 60.0):
                    alert_to_send = alert
                    _last_sent_alerts[v.id] = {"type": alert_type, "timestamp": now_ts}
            else:
                if v.id in _last_sent_alerts:
                    del _last_sent_alerts[v.id]

            updates.append({
                "vehicle": {
                    "id": v.id,
                    "vehicle_number": v.vehicle_number,
                    "vehicle_name": v.vehicle_name,
                    "driver_name": v.driver_name,
                    "driver_phone": v.driver_phone,
                    "lat": round(new_lat, 6),
                    "lng": round(new_lng, 6),
                    "heading": round(heading, 1),
                    "speed": round(speed_kmh, 1),
                    "status": v.status.value,
                    "on_route": on_route,
                    "behavior_score": new_score,
                    "street_name": v.street_name,
                    "ward_id": v.ward_id,
                    "eta": v.eta,
                    "fuel_level": int(new_fuel),
                    "route_history": history,
                    "last_updated": datetime.now(timezone.utc).isoformat(),
                },
                "alert": alert_to_send,
            })

        await db.commit()

    # Broadcast updates after DB commit (outside session)
    for upd in updates:
        await manager.broadcast({
            "type": "vehicle_gps_update",
            "vehicle": upd["vehicle"],
        })
        if upd["alert"]:
            await manager.broadcast({
                "type": "alert",
                "alert": upd["alert"],
            })


async def run_gps_simulator():
    """
    Main simulator loop. Runs every 3 seconds while there are active WebSocket clients.
    Backs off to 10-second interval if no clients are connected.
    """
    from backend.websocket.vehicle_ws import manager

    print("[GPS Simulator] Started — broadcasting vehicle movements every 3s")
    while True:
        try:
            if manager.active_connections:
                await _simulate_tick()
                await asyncio.sleep(3)
            else:
                # No clients — run at reduced rate to keep DB somewhat current
                await _simulate_tick()
                await asyncio.sleep(10)
        except asyncio.CancelledError:
            print("[GPS Simulator] Stopped.")
            break
        except Exception as e:
            print(f"[GPS Simulator] Error: {e}")
            await asyncio.sleep(5)  # backoff on error


def start_simulator() -> asyncio.Task:
    """Start the GPS simulator as a background asyncio task."""
    global _simulator_task
    _simulator_task = asyncio.create_task(run_gps_simulator())
    return _simulator_task


def stop_simulator():
    """Cancel the simulator task."""
    global _simulator_task
    if _simulator_task and not _simulator_task.done():
        _simulator_task.cancel()

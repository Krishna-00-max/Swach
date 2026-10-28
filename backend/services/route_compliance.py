"""
Route Compliance Engine — Pure Functions
Handles GPS proximity checks, heading calculation, and behavior scoring.
"""
import math
from typing import List, Optional


# --- Constants ---
ON_ROUTE_THRESHOLD_M = 30.0    # meters — vehicle considered "on route" if within 30m of a street point
OVERSPEED_THRESHOLD = 40.0     # km/h — anything above this is flagged
IDLE_SPEED_THRESHOLD = 1.0     # km/h — below this is considered stationary/idle


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate the great-circle distance in meters between two GPS coordinates.
    Uses the Haversine formula.
    """
    R = 6_371_000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)

    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def compute_heading(prev_lat: float, prev_lng: float, curr_lat: float, curr_lng: float) -> float:
    """
    Compute compass bearing (0-360°, north=0°) from previous to current GPS point.
    Returns previous heading if positions are identical.
    """
    if abs(curr_lat - prev_lat) < 1e-8 and abs(curr_lng - prev_lng) < 1e-8:
        return 0.0

    lat1 = math.radians(prev_lat)
    lat2 = math.radians(curr_lat)
    d_lng = math.radians(curr_lng - prev_lng)

    x = math.sin(d_lng) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(d_lng)
    bearing = math.degrees(math.atan2(x, y))
    return (bearing + 360) % 360  # normalise to 0-360


def check_on_route(
    vehicle_lat: float,
    vehicle_lng: float,
    street_points: List[dict],
    threshold_m: float = ON_ROUTE_THRESHOLD_M,
) -> bool:
    """
    Returns True if the vehicle is within `threshold_m` metres of ANY street
    point passed in.  Street points should be list of {lat, lng} dicts.
    """
    for pt in street_points:
        pt_lat = pt.get("lat")
        pt_lng = pt.get("lng")
        if pt_lat is None or pt_lng is None:
            continue
        if haversine_distance(vehicle_lat, vehicle_lng, pt_lat, pt_lng) <= threshold_m:
            return True
    return False


def compute_behavior_score(
    on_route: bool,
    speed: float,
    fuel_level: int,
    current_score: float = 85.0,
) -> float:
    """
    Incrementally update the behavior score based on current state.
    Formula:
      - on_route bonus/penalty: ±0.5 per tick
      - speed compliance: penalty if overspeeding
      - fuel awareness: small penalty if < 20%
    Score is clamped to [0, 100].
    """
    delta = 0.0

    # On-route compliance: +0.4 if on route, -1.0 if off route
    if on_route:
        delta += 0.4
    else:
        delta -= 1.0

    # Speed compliance
    if speed > OVERSPEED_THRESHOLD:
        excess = speed - OVERSPEED_THRESHOLD
        delta -= min(excess * 0.1, 2.0)  # up to -2 per tick

    # Fuel awareness
    if fuel_level < 20:
        delta -= 0.2

    new_score = current_score + delta
    return round(max(0.0, min(100.0, new_score)), 2)


def classify_alert(vehicle_id: int, vehicle_number: str, speed: float, on_route: bool, idle_seconds: int = 0) -> Optional[dict]:
    """
    Returns an alert dict if any threshold is breached, else None.
    """
    if speed > OVERSPEED_THRESHOLD:
        return {
            "type": "SPEEDING",
            "vehicle_id": vehicle_id,
            "vehicle_number": vehicle_number,
            "message": f"{vehicle_number} is overspeeding at {speed:.1f} km/h (limit: {OVERSPEED_THRESHOLD} km/h)",
            "severity": "critical",
        }
    if not on_route:
        return {
            "type": "OFF_ROUTE",
            "vehicle_id": vehicle_id,
            "vehicle_number": vehicle_number,
            "message": f"{vehicle_number} has deviated from its assigned route",
            "severity": "warning",
        }
    if idle_seconds > 600:  # 10 minutes idle
        return {
            "type": "IDLE",
            "vehicle_id": vehicle_id,
            "vehicle_number": vehicle_number,
            "message": f"{vehicle_number} has been stationary for {idle_seconds // 60} minutes",
            "severity": "info",
        }
    return None

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone

from backend.database import get_db
from backend.models.vehicle import Vehicle, VehicleStatus, MaintenanceLog, VehicleLocationHistory
from backend.auth.dependencies import get_current_active_user, require_any_role
from backend.models.user import User
from backend.services.route_compliance import (
    compute_heading,
    check_on_route,
    compute_behavior_score,
    classify_alert,
)

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class VehicleResponse(BaseModel):
    id: int
    vehicle_number: str
    vehicle_name: str
    driver_name: str
    driver_phone: Optional[str]
    lat: Optional[float]
    lng: Optional[float]
    status: VehicleStatus
    street_name: Optional[str]
    speed: float
    ward_id: Optional[int]
    eta: Optional[str]
    fuel_level: int
    heading: Optional[float] = 0.0
    on_route: Optional[bool] = True
    behavior_score: Optional[float] = 85.0
    route_history: Optional[list] = []
    last_updated: datetime

    class Config:
        from_attributes = True


class VehicleUpdate(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    status: Optional[VehicleStatus] = None
    street_name: Optional[str] = None
    speed: Optional[float] = None
    eta: Optional[str] = None
    fuel_level: Optional[int] = None


class GPSPushPayload(BaseModel):
    """Payload sent by a driver's phone via the /gps endpoint."""
    lat: float
    lng: float
    speed: float = 0.0
    accuracy: Optional[float] = None
    heading: Optional[float] = None


class LeaderboardEntry(BaseModel):
    rank: int
    vehicle_id: int
    vehicle_number: str
    driver_name: str
    behavior_score: float
    on_route: bool
    speed: float
    status: str


class VehicleCreate(BaseModel):
    vehicle_number: str
    vehicle_name: str
    driver_name: str
    ward_id: Optional[int] = 1


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/", response_model=VehicleResponse)
async def create_vehicle(
    payload: VehicleCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new vehicle for testing/tracking."""
    result = await db.execute(select(Vehicle).where(Vehicle.vehicle_number == payload.vehicle_number))
    existing = result.scalar_one_or_none()
    if existing:
        return existing
        
    vehicle = Vehicle(
        vehicle_number=payload.vehicle_number,
        vehicle_name=payload.vehicle_name,
        driver_name=payload.driver_name,
        driver_phone="123-456-7890",
        lat=16.5150,
        lng=80.5150,
        status=VehicleStatus.active,
        speed=0.0,
        ward_id=payload.ward_id,
        fuel_level=100,
        route_history=[]
    )
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)
    return vehicle


@router.get("/public", response_model=List[VehicleResponse])
async def get_public_vehicles(
    db: AsyncSession = Depends(get_db)
):
    """Public endpoint — no auth required. Used by Citizen Portal."""
    result = await db.execute(select(Vehicle).order_by(Vehicle.id))
    return result.scalars().all()


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_driver_leaderboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Returns vehicles sorted by behavior_score descending (driver leaderboard)."""
    ward_id = getattr(current_user, "ward_id", None)
    q = select(Vehicle).order_by(Vehicle.behavior_score.desc())
    if ward_id:
        q = q.where(Vehicle.ward_id == ward_id)
    result = await db.execute(q)
    vehicles = result.scalars().all()
    return [
        LeaderboardEntry(
            rank=i + 1,
            vehicle_id=v.id,
            vehicle_number=v.vehicle_number,
            driver_name=v.driver_name,
            behavior_score=round(v.behavior_score or 0.0, 1),
            on_route=v.on_route if v.on_route is not None else True,
            speed=round(v.speed or 0.0, 1),
            status=v.status.value,
        )
        for i, v in enumerate(vehicles)
    ]


@router.get("/alerts")
async def get_vehicle_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Returns current alert conditions for all vehicles."""
    ward_id = getattr(current_user, "ward_id", None)
    q = select(Vehicle)
    if ward_id:
        q = q.where(Vehicle.ward_id == ward_id)
    result = await db.execute(q)
    vehicles = result.scalars().all()
    alerts = []
    for v in vehicles:
        a = classify_alert(
            vehicle_id=v.id,
            vehicle_number=v.vehicle_number,
            speed=v.speed or 0.0,
            on_route=v.on_route if v.on_route is not None else True,
            idle_seconds=0,
        )
        if a:
            alerts.append(a)
    return {"alerts": alerts, "count": len(alerts)}


@router.get("/stats/summary")
async def get_vehicle_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ward_id = getattr(current_user, "ward_id", None)
    q = select(Vehicle)
    if ward_id:
        q = q.where(Vehicle.ward_id == ward_id)
    result = await db.execute(q)
    vehicles = result.scalars().all()
    on_route_count = sum(1 for v in vehicles if v.on_route is not False)
    avg_score = sum(v.behavior_score or 0 for v in vehicles) / max(len(vehicles), 1)
    return {
        "total": len(vehicles),
        "active": sum(1 for v in vehicles if v.status == VehicleStatus.active),
        "delayed": sum(1 for v in vehicles if v.status == VehicleStatus.delayed),
        "offline": sum(1 for v in vehicles if v.status == VehicleStatus.offline),
        "maintenance": sum(1 for v in vehicles if v.status == VehicleStatus.maintenance),
        "on_route": on_route_count,
        "off_route": len(vehicles) - on_route_count,
        "avg_behavior_score": round(avg_score, 1),
    }


@router.get("/", response_model=List[VehicleResponse])
async def get_all_vehicles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ward_id = getattr(current_user, "ward_id", None)
    q = select(Vehicle).order_by(Vehicle.id)
    if ward_id:
        q = q.where(Vehicle.ward_id == ward_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.get("/{vehicle_id}/history")
async def get_vehicle_history(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Returns full route history for GPS replay."""
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {
        "vehicle_id": vehicle_id,
        "vehicle_number": vehicle.vehicle_number,
        "driver_name": vehicle.driver_name,
        "route_history": vehicle.route_history or [],
        "total_points": len(vehicle.route_history or []),
    }


@router.post("/{vehicle_id}/gps")
async def push_vehicle_gps(
    vehicle_id: int,
    payload: GPSPushPayload,
    db: AsyncSession = Depends(get_db),
):
    """
    Driver GPS Push — no auth required (driver uses phone token).
    Accepts live GPS from driver's phone, runs compliance check, updates DB, broadcasts.
    """
    from backend.websocket.vehicle_ws import manager

    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    from backend.models.street import Street
    streets_result = await db.execute(
        select(Street).where(Street.ward_id == vehicle.ward_id)
    )
    ward_streets = streets_result.scalars().all()
    street_points = [{"lat": s.lat, "lng": s.lng} for s in ward_streets if s.lat and s.lng]

    prev_lat = vehicle.lat or payload.lat
    prev_lng = vehicle.lng or payload.lng

    # Compute derived fields
    heading = payload.heading or compute_heading(prev_lat, prev_lng, payload.lat, payload.lng)
    
    from backend.services.gis_service import check_vehicle_on_route
    postgis_on_route = await check_vehicle_on_route(db, payload.lat, payload.lng, vehicle.ward_id, threshold_m=30.0)
    if postgis_on_route is not None:
        on_route = postgis_on_route
    else:
        on_route = check_on_route(payload.lat, payload.lng, street_points) if street_points else True
    new_score = compute_behavior_score(
        on_route=on_route,
        speed=payload.speed,
        fuel_level=vehicle.fuel_level or 80,
        current_score=vehicle.behavior_score or 85.0,
    )

    # Route history
    history = list(vehicle.route_history or [])
    history.append({
        "lat": payload.lat,
        "lng": payload.lng,
        "ts": datetime.now(timezone.utc).isoformat(),
        "on_route": on_route,
        "speed": payload.speed,
    })
    history = history[-50:]

    update_data = {
        "lat": payload.lat,
        "lng": payload.lng,
        "heading": heading,
        "speed": payload.speed,
        "on_route": on_route,
        "behavior_score": new_score,
        "route_history": history,
        "status": VehicleStatus.active,
    }
    await db.execute(update(Vehicle).where(Vehicle.id == vehicle_id).values(**update_data))
    await db.commit()

    # Broadcast update
    vehicle_data = {
        "id": vehicle.id,
        "vehicle_number": vehicle.vehicle_number,
        "vehicle_name": vehicle.vehicle_name,
        "driver_name": vehicle.driver_name,
        "lat": payload.lat,
        "lng": payload.lng,
        "heading": heading,
        "speed": payload.speed,
        "status": VehicleStatus.active.value,
        "on_route": on_route,
        "behavior_score": new_score,
        "street_name": vehicle.street_name,
        "ward_id": vehicle.ward_id,
        "fuel_level": vehicle.fuel_level,
        "route_history": history,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }
    await manager.broadcast({"type": "vehicle_gps_update", "vehicle": vehicle_data})

    # Alert check
    alert = classify_alert(vehicle.id, vehicle.vehicle_number, payload.speed, on_route)
    if alert:
        await manager.broadcast({"type": "alert", "alert": alert})

    return {"status": "ok", "on_route": on_route, "behavior_score": new_score}


@router.patch("/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: int,
    data: VehicleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    update_data = data.model_dump(exclude_none=True)
    if update_data:
        if "lat" in update_data and "lng" in update_data:
            history = list(vehicle.route_history or [])
            history.append({
                "lat": update_data["lat"],
                "lng": update_data["lng"],
                "ts": datetime.now(timezone.utc).isoformat(),
            })
            update_data["route_history"] = history[-50:]

        await db.execute(update(Vehicle).where(Vehicle.id == vehicle_id).values(**update_data))
        await db.flush()
        result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
        vehicle = result.scalar_one()

    # Broadcast update
    from backend.websocket.vehicle_ws import broadcast_vehicle_update
    await broadcast_vehicle_update({
        "id": vehicle.id,
        "vehicle_number": vehicle.vehicle_number,
        "lat": vehicle.lat,
        "lng": vehicle.lng,
        "heading": vehicle.heading,
        "speed": vehicle.speed,
        "status": vehicle.status.value,
        "on_route": vehicle.on_route,
        "behavior_score": vehicle.behavior_score,
        "fuel_level": vehicle.fuel_level,
        "last_updated": vehicle.last_updated.isoformat() if vehicle.last_updated else None,
    })
    return vehicle

# ── Maintenance Endpoints ──

class MaintenanceCreate(BaseModel):
    description: str
    scheduled_date: datetime
    cost: Optional[float] = None
    mechanic_notes: Optional[str] = None

@router.get("/{vehicle_id}/maintenance")
async def get_vehicle_maintenance(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(MaintenanceLog).where(MaintenanceLog.vehicle_id == vehicle_id).order_by(MaintenanceLog.scheduled_date.desc()))
    return result.scalars().all()

@router.post("/{vehicle_id}/maintenance")
async def create_maintenance_log(
    vehicle_id: int,
    payload: MaintenanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in ["admin", "municipal_officer", "supervisor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    log = MaintenanceLog(
        vehicle_id=vehicle_id,
        **payload.model_dump()
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log

# ── AI Optimization Endpoint ──

@router.get("/{vehicle_id}/optimize-route")
async def optimize_route(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Simulated AI route optimization
    return {
        "vehicle_id": vehicle_id,
        "status": "optimized",
        "optimized_waypoints": [
            {"lat": 16.5131, "lng": 80.5165, "stop_name": "Start / Depot"},
            {"lat": 16.5200, "lng": 80.5200, "stop_name": "Complaint #123"},
            {"lat": 16.5250, "lng": 80.5180, "stop_name": "Ward 3 Collection Point"},
            {"lat": 16.5300, "lng": 80.5100, "stop_name": "End / Disposal Facility"}
        ]
    }

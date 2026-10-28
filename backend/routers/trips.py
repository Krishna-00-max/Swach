from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime, timezone

from backend.database import get_db
from backend.models.vehicle import Trip, Vehicle
from backend.models.user import User
from backend.auth.dependencies import get_current_active_user

router = APIRouter(
    prefix="/api/trips",
    tags=["Trips"],
    dependencies=[Depends(get_current_active_user)]
)

@router.get("/")
async def get_trips(vehicle_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    """Get all trips, optionally filtered by vehicle_id."""
    query = select(Trip).order_by(desc(Trip.created_at))
    if vehicle_id:
        query = query.where(Trip.vehicle_id == vehicle_id)
        
    result = await db.execute(query)
    trips = result.scalars().all()
    return trips

@router.post("/start")
async def start_trip(vehicle_id: int, driver_id: int, planned_route: list = [], db: AsyncSession = Depends(get_db)):
    """Start a new trip for a vehicle."""
    # Check if there is already an active trip for this vehicle
    query = select(Trip).where(Trip.vehicle_id == vehicle_id, Trip.is_active == True)
    result = await db.execute(query)
    active_trip = result.scalars().first()
    
    if active_trip:
        raise HTTPException(status_code=400, detail="Vehicle already has an active trip.")
        
    new_trip = Trip(
        vehicle_id=vehicle_id,
        driver_id=driver_id,
        planned_route=planned_route,
        is_active=True
    )
    
    db.add(new_trip)
    await db.commit()
    await db.refresh(new_trip)
    return new_trip

@router.post("/{trip_id}/end")
async def end_trip(trip_id: int, distance_km: float = 0.0, idle_time_mins: int = 0, stops_made: int = 0, db: AsyncSession = Depends(get_db)):
    """End an active trip."""
    query = select(Trip).where(Trip.id == trip_id)
    result = await db.execute(query)
    trip = result.scalars().first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
        
    if not trip.is_active:
        raise HTTPException(status_code=400, detail="Trip is already ended.")
        
    trip.end_time = datetime.now(timezone.utc)
    trip.is_active = False
    trip.distance_km = distance_km
    trip.idle_time_mins = idle_time_mins
    trip.stops_made = stops_made
    
    # Calculate simple compliance pct based on some mock logic or 100% for now
    trip.compliance_pct = 95.0
    
    # Update the vehicle's daily distance
    v_query = select(Vehicle).where(Vehicle.id == trip.vehicle_id)
    v_result = await db.execute(v_query)
    vehicle = v_result.scalars().first()
    if vehicle:
        vehicle.daily_distance_km += distance_km
        
    await db.commit()
    await db.refresh(trip)
    return trip

@router.get("/{trip_id}/replay")
async def replay_trip(trip_id: int, db: AsyncSession = Depends(get_db)):
    """Get trip details including actual route history (stub)."""
    query = select(Trip).where(Trip.id == trip_id)
    result = await db.execute(query)
    trip = result.scalars().first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
        
    # In a real app, query VehicleLocationHistory between trip.start_time and trip.end_time
    return trip

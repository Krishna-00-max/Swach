from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

from backend.database import get_db
from backend.models.stats import DailyStat
from backend.models.vehicle import Vehicle, VehicleStatus
from backend.models.complaint import Complaint, ComplaintStatus
from backend.models.street import Street, StreetStatus
from backend.auth.dependencies import get_current_active_user
from backend.models.user import User

router = APIRouter(prefix="/api/stats", tags=["Statistics"])


class KPIResponse(BaseModel):
    streets_covered_today: int
    streets_total: int
    coverage_percent: float
    households_visited: int
    active_vehicles: int
    total_vehicles: int
    complaints_raised_today: int
    complaints_resolved: int
    cleanliness_score: float
    pending_areas: int
    waste_collected_kg: float


class DailyStatResponse(BaseModel):
    date: date
    ward_id: Optional[int]
    streets_covered: int
    households_visited: int
    complaints_raised: int
    complaints_resolved: int
    cleanliness_score: float
    waste_collected_kg: float

    class Config:
        from_attributes = True


@router.get("/kpis", response_model=KPIResponse)
async def get_kpis(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    today = datetime.utcnow().date()
    ward_id = getattr(current_user, "ward_id", None)

    # Streets
    street_query = select(Street)
    if ward_id:
        street_query = street_query.where(Street.ward_id == ward_id)
    streets_result = await db.execute(street_query)
    streets = streets_result.scalars().all()
    covered = [s for s in streets if s.status == StreetStatus.covered]
    coverage = round(len(covered) / max(len(streets), 1) * 100, 1)

    # Vehicles
    vehicle_query = select(Vehicle)
    if ward_id:
        vehicle_query = vehicle_query.where(Vehicle.ward_id == ward_id)
    v_result = await db.execute(vehicle_query)
    vehicles = v_result.scalars().all()
    active_v = sum(1 for v in vehicles if v.status == VehicleStatus.active)

    # Complaints
    complaint_query = select(Complaint)
    if ward_id:
        complaint_query = complaint_query.where(Complaint.ward_id == ward_id)
    c_result = await db.execute(complaint_query)
    complaints = c_result.scalars().all()
    today_complaints = sum(1 for c in complaints if c.raised_at.date() == today)
    resolved = sum(1 for c in complaints if c.status == ComplaintStatus.resolved)

    # Daily stat
    stat_query = select(DailyStat).where(DailyStat.date == today)
    if ward_id:
        stat_query = stat_query.where(DailyStat.ward_id == ward_id)
    stat_result = await db.execute(stat_query)
    stat = stat_result.scalar_one_or_none()

    return KPIResponse(
        streets_covered_today=len(covered),
        streets_total=len(streets),
        coverage_percent=coverage,
        households_visited=stat.households_visited if stat else sum(s.households_count for s in covered),
        active_vehicles=active_v,
        total_vehicles=len(vehicles),
        complaints_raised_today=today_complaints,
        complaints_resolved=resolved,
        cleanliness_score=stat.cleanliness_score if stat else round(coverage * 0.85, 1),
        pending_areas=len(streets) - len(covered),
        waste_collected_kg=stat.waste_collected_kg if stat else 0.0,
    )


@router.get("/daily", response_model=List[DailyStatResponse])
async def get_daily_stats(
    days: int = Query(30, le=365),
    ward_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user_ward_id = getattr(current_user, "ward_id", None)
    filter_ward_id = user_ward_id if user_ward_id is not None else ward_id

    q = select(DailyStat).order_by(DailyStat.date.desc()).limit(days)
    if filter_ward_id:
        q = q.where(DailyStat.ward_id == filter_ward_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/weekly")
async def get_weekly_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ward_id = getattr(current_user, "ward_id", None)
    q = select(DailyStat).order_by(DailyStat.date.desc())
    if ward_id:
        q = q.where(DailyStat.ward_id == ward_id)
    result = await db.execute(q.limit(7))
    stats = result.scalars().all()
    return [
        {
            "date": str(s.date),
            "streets": s.streets_covered,
            "households": s.households_visited,
            "complaints": s.complaints_raised,
            "resolved": s.complaints_resolved,
            "score": s.cleanliness_score,
            "waste_kg": s.waste_collected_kg,
        }
        for s in stats
    ]

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from backend.database import get_db
from backend.models.street import Street, StreetStatus
from backend.auth.dependencies import get_current_active_user
from backend.models.user import User

router = APIRouter(prefix="/api/streets", tags=["Streets"])


class StreetResponse(BaseModel):
    id: int
    name: str
    ward_id: int
    status: StreetStatus
    households_count: int
    assigned_vehicle_id: Optional[int]
    covered_at: Optional[datetime]
    length_km: float
    lat: Optional[float]
    lng: Optional[float]

    class Config:
        from_attributes = True


class StreetStatusUpdate(BaseModel):
    status: StreetStatus
    assigned_vehicle_id: Optional[int] = None


@router.get("/", response_model=List[StreetResponse])
async def get_streets(
    ward_id: Optional[int] = Query(None),
    status: Optional[StreetStatus] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user_ward_id = getattr(current_user, "ward_id", None)
    filter_ward_id = user_ward_id if user_ward_id is not None else ward_id

    q = select(Street).order_by(Street.ward_id, Street.name)
    if filter_ward_id:
        q = q.where(Street.ward_id == filter_ward_id)
    if status:
        q = q.where(Street.status == status)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/coverage")
async def get_coverage_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ward_id = getattr(current_user, "ward_id", None)
    street_query = select(Street)
    if ward_id:
        street_query = street_query.where(Street.ward_id == ward_id)
    
    result = await db.execute(street_query)
    streets = result.scalars().all()

    ward_data = {}
    for s in streets:
        wid = s.ward_id
        if wid not in ward_data:
            ward_data[wid] = {"ward_id": wid, "total": 0, "covered": 0, "missed": 0, "in_progress": 0}
        ward_data[wid]["total"] += 1
        if s.status == StreetStatus.covered:
            ward_data[wid]["covered"] += 1
        elif s.status == StreetStatus.missed:
            ward_data[wid]["missed"] += 1
        elif s.status == StreetStatus.in_progress:
            ward_data[wid]["in_progress"] += 1

    for w in ward_data.values():
        w["coverage_percent"] = round(w["covered"] / max(w["total"], 1) * 100, 1)

    total = len(streets)
    covered = sum(1 for s in streets if s.status == StreetStatus.covered)
    return {
        "overall_coverage": round(covered / max(total, 1) * 100, 1),
        "total_streets": total,
        "covered": covered,
        "missed": sum(1 for s in streets if s.status == StreetStatus.missed),
        "in_progress": sum(1 for s in streets if s.status == StreetStatus.in_progress),
        "by_ward": list(ward_data.values()),
    }


@router.patch("/{street_id}/status", response_model=StreetResponse)
async def update_street_status(
    street_id: int,
    data: StreetStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    update_data = data.model_dump(exclude_none=True)
    if data.status == StreetStatus.covered:
        update_data["covered_at"] = datetime.utcnow()
    await db.execute(update(Street).where(Street.id == street_id).values(**update_data))
    await db.flush()
    result = await db.execute(select(Street).where(Street.id == street_id))
    return result.scalar_one()


class StreetCreate(BaseModel):
    name: str
    ward_id: int
    lat: float
    lng: float
    length_km: float = 0.5
    households_count: int = 20
    assigned_vehicle_id: Optional[int] = None


@router.post("/", response_model=StreetResponse)
async def create_street(
    payload: StreetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    street = Street(
        name=payload.name,
        ward_id=payload.ward_id,
        status=StreetStatus.scheduled,
        households_count=payload.households_count,
        length_km=payload.length_km,
        lat=payload.lat,
        lng=payload.lng,
        assigned_vehicle_id=payload.assigned_vehicle_id
    )
    db.add(street)
    await db.commit()
    await db.refresh(street)
    return street

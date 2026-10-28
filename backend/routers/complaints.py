import random
import string
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from backend.database import get_db
from backend.models.complaint import Complaint, ComplaintCategory, ComplaintStatus
from backend.auth.dependencies import get_current_active_user
from backend.models.user import User
from backend.services import notification_service, openai_service

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])


def generate_complaint_number():
    return "CMP-" + "".join(random.choices(string.digits, k=6))


class ComplaintCreate(BaseModel):
    category: ComplaintCategory
    description: str
    raised_by: str
    raised_by_phone: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    address: Optional[str] = None
    ward_id: Optional[int] = None
    image_url: Optional[str] = None


class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: int
    complaint_number: str
    category: ComplaintCategory
    description: str
    raised_by: str
    raised_by_phone: Optional[str]
    lat: Optional[float]
    lng: Optional[float]
    address: Optional[str]
    ward_id: Optional[int]
    status: ComplaintStatus
    assigned_to: Optional[str]
    resolution_notes: Optional[str]
    raised_at: datetime
    resolved_at: Optional[datetime]
    image_url: Optional[str]

    class Config:
        from_attributes = True


@router.get("/", response_model=List[ComplaintResponse])
async def get_complaints(
    status: Optional[ComplaintStatus] = Query(None),
    ward_id: Optional[int] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user_ward_id = getattr(current_user, "ward_id", None)
    filter_ward_id = user_ward_id if user_ward_id is not None else ward_id

    q = select(Complaint).order_by(Complaint.raised_at.desc())
    if status:
        q = q.where(Complaint.status == status)
    if filter_ward_id:
        q = q.where(Complaint.ward_id == filter_ward_id)
    q = q.limit(limit).offset(offset)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=ComplaintResponse, status_code=201)
async def create_complaint(
    data: ComplaintCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    complaint = Complaint(
        complaint_number=generate_complaint_number(),
        **data.model_dump()
    )
    db.add(complaint)
    await db.flush()
    await db.refresh(complaint)
    return complaint

@router.post("/public", response_model=ComplaintResponse, status_code=201)
async def create_public_complaint(
    data: ComplaintCreate,
    db: AsyncSession = Depends(get_db)
):
    complaint = Complaint(
        complaint_number=generate_complaint_number(),
        **data.model_dump()
    )
    db.add(complaint)
    await db.flush()
    await db.refresh(complaint)
    return complaint

@router.get("/public/track/{complaint_number}", response_model=ComplaintResponse)
async def track_public_complaint(
    complaint_number: str,
    db: AsyncSession = Depends(get_db)
):
    q = select(Complaint).where(Complaint.complaint_number == complaint_number)
    result = await db.execute(q)
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint

@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
async def update_complaint_status(
    complaint_id: int,
    data: ComplaintStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    update_data = data.model_dump(exclude_none=True)
    if data.status == ComplaintStatus.resolved:
        update_data["resolved_at"] = datetime.utcnow()
    if data.status == ComplaintStatus.assigned:
        update_data["assigned_at"] = datetime.utcnow()

    await db.execute(update(Complaint).where(Complaint.id == complaint_id).values(**update_data))
    await db.flush()
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    updated_complaint = result.scalar_one()
    
    if data.status == ComplaintStatus.resolved and updated_complaint.raised_by_phone:
        import asyncio
        asyncio.create_task(notification_service.send_resolution_alert(
            updated_complaint.raised_by_phone,
            updated_complaint.complaint_number,
            "Resolved"
        ))

    return updated_complaint

class VerifyRequest(BaseModel):
    image_url: str

@router.post("/{complaint_id}/verify-cleanliness")
async def verify_complaint_cleanliness(
    complaint_id: int,
    request: VerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await openai_service.verify_cleanliness(request.image_url)
    return result


@router.get("/stats/summary")
async def get_complaint_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ward_id = getattr(current_user, "ward_id", None)
    q = select(Complaint)
    if ward_id:
        q = q.where(Complaint.ward_id == ward_id)
    result = await db.execute(q)
    complaints = result.scalars().all()
    today = datetime.utcnow().date()
    from backend.models.complaint import ComplaintCategory
    return {
        "total": len(complaints),
        "today": sum(1 for c in complaints if c.raised_at.date() == today),
        "raised": sum(1 for c in complaints if c.status == ComplaintStatus.raised),
        "in_progress": sum(1 for c in complaints if c.status == ComplaintStatus.in_progress),
        "resolved": sum(1 for c in complaints if c.status == ComplaintStatus.resolved),
        "by_category": {cat.value: sum(1 for c in complaints if c.category == cat) for cat in ComplaintCategory},
    }

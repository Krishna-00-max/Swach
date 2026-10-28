from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from backend.database import get_db
from backend.models.worker import Worker, AttendanceStatus
from backend.auth.dependencies import get_current_active_user
from backend.models.user import User

router = APIRouter(prefix="/api/workers", tags=["Workers"])


class WorkerResponse(BaseModel):
    id: int
    name: str
    employee_id: str
    phone: Optional[str]
    ward_id: Optional[int]
    assigned_route: Optional[str]
    attendance: AttendanceStatus
    tasks_completed: int
    tasks_total: int
    performance_score: float
    shift_start: str
    shift_end: str
    is_active: bool

    class Config:
        from_attributes = True


class AttendanceUpdate(BaseModel):
    worker_id: int
    attendance: AttendanceStatus


class WorkerTaskUpdate(BaseModel):
    tasks_completed: int


@router.get("/", response_model=List[WorkerResponse])
async def get_workers(
    ward_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user_ward_id = getattr(current_user, "ward_id", None)
    filter_ward_id = user_ward_id if user_ward_id is not None else ward_id

    q = select(Worker).where(Worker.is_active == True).order_by(Worker.name)
    if filter_ward_id:
        q = q.where(Worker.ward_id == filter_ward_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/attendance")
async def mark_attendance(
    data: AttendanceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    await db.execute(
        update(Worker).where(Worker.id == data.worker_id).values(attendance=data.attendance)
    )
    return {"message": f"Attendance marked as {data.attendance.value}"}


@router.patch("/{worker_id}/tasks", response_model=WorkerResponse)
async def update_tasks(
    worker_id: int,
    data: WorkerTaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Worker).where(Worker.id == worker_id))
    worker = result.scalar_one_or_none()
    perf = round(data.tasks_completed / max(worker.tasks_total, 1) * 100, 1) if worker else 0
    await db.execute(
        update(Worker).where(Worker.id == worker_id).values(
            tasks_completed=data.tasks_completed, performance_score=perf
        )
    )
    await db.flush()
    result = await db.execute(select(Worker).where(Worker.id == worker_id))
    return result.scalar_one()


@router.get("/performance")
async def get_performance_leaderboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ward_id = getattr(current_user, "ward_id", None)
    q = select(Worker).where(Worker.is_active == True).order_by(Worker.performance_score.desc())
    if ward_id:
        q = q.where(Worker.ward_id == ward_id)
    result = await db.execute(q.limit(10))
    workers = result.scalars().all()
    return [
        {
            "rank": idx + 1,
            "name": w.name,
            "employee_id": w.employee_id,
            "ward_id": w.ward_id,
            "performance_score": w.performance_score,
            "tasks_completed": w.tasks_completed,
            "tasks_total": w.tasks_total,
            "attendance": w.attendance.value,
        }
        for idx, w in enumerate(workers)
    ]

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from backend.database import get_db
from backend.models.payroll import PayrollRecord, PayrollStatus
from backend.models.worker import Worker
from backend.auth.dependencies import get_current_active_user
from backend.models.user import User

router = APIRouter(prefix="/api/payroll", tags=["Payroll"])


@router.get("/")
async def get_payrolls(
    month: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not month:
        month = datetime.utcnow().strftime("%Y-%m")
    
    result = await db.execute(select(PayrollRecord).where(PayrollRecord.month == month))
    return result.scalars().all()


@router.post("/calculate")
async def calculate_payroll(
    month: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not month:
        month = datetime.utcnow().strftime("%Y-%m")

    # Fetch all workers
    result = await db.execute(select(Worker))
    workers = result.scalars().all()

    payrolls = []
    for worker in workers:
        # Mock calculation: 
        # Base daily wage = 500
        # Assume 26 working days a month. Let's use tasks_completed as a proxy for days_present right now.
        base_salary = 500 * worker.tasks_completed
        
        bonus = 0.0
        if worker.performance_score > 8.0:
            bonus = 1000.0 # flat bonus
        
        total = base_salary + bonus
        
        # Check if record exists
        pr_result = await db.execute(
            select(PayrollRecord)
            .where(PayrollRecord.worker_id == worker.id)
            .where(PayrollRecord.month == month)
        )
        record = pr_result.scalar_one_or_none()

        if record:
            record.base_salary = base_salary
            record.performance_bonus = bonus
            record.total_payout = total
            record.days_present = worker.tasks_completed
        else:
            record = PayrollRecord(
                worker_id=worker.id,
                month=month,
                days_present=worker.tasks_completed,
                base_salary=base_salary,
                performance_bonus=bonus,
                total_payout=total
            )
            db.add(record)
        
        payrolls.append(record)

    await db.flush()
    return payrolls

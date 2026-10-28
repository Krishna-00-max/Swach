from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func, Enum as SAEnum
from backend.database import Base
import enum

class PayrollStatus(str, enum.Enum):
    pending = "Pending"
    paid = "Paid"

class PayrollRecord(Base):
    __tablename__ = "payroll"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    month = Column(String(20), nullable=False) # e.g. "2024-05"
    days_present = Column(Integer, default=0)
    base_salary = Column(Float, default=0.0)
    attendance_deduction = Column(Float, default=0.0)
    performance_bonus = Column(Float, default=0.0)
    total_payout = Column(Float, default=0.0)
    status = Column(SAEnum(PayrollStatus), default=PayrollStatus.pending)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

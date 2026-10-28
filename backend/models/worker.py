from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, Float, func, Boolean, JSON
from backend.database import Base
import enum


class AttendanceStatus(str, enum.Enum):
    present = "Present"
    absent = "Absent"
    leave = "Leave"
    half_day = "Half Day"


class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    employee_id = Column(String(20), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    ward_id = Column(Integer, nullable=True)
    assigned_route = Column(String(200), nullable=True)
    attendance = Column(SAEnum(AttendanceStatus), default=AttendanceStatus.absent)
    tasks_completed = Column(Integer, default=0)
    tasks_total = Column(Integer, default=10)
    performance_score = Column(Float, default=0.0)
    shift_start = Column(String(10), default="06:00")
    shift_end = Column(String(10), default="14:00")
    
    # Phase 4 Additions
    assigned_vehicle_id = Column(Integer, nullable=True)
    leave_balance = Column(Integer, default=12)
    training_status = Column(String(50), default="Completed")
    personal_details = Column(JSON, default=dict) # Address, emergency contact, etc.
    
    is_active = Column(Boolean, default=True)
    joining_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

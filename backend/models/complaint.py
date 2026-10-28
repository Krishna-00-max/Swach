from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, Float, Text, func, Index
from backend.database import Base
import enum


class ComplaintCategory(str, enum.Enum):
    garbage_not_collected = "Garbage Not Collected"
    overflowing_bin = "Overflowing Bin"
    illegal_dumping = "Illegal Dumping"
    drain_blocked = "Drain Blocked"
    sanitation_issue = "Sanitation Issue"
    vehicle_missed = "Vehicle Missed"
    other = "Other"


class ComplaintStatus(str, enum.Enum):
    raised = "Raised"
    ai_categorized = "AI Categorized"
    supervisor_assigned = "Supervisor Assigned"
    worker_assigned = "Worker Assigned"
    work_started = "Work Started"
    photo_uploaded = "Photo Uploaded"
    ai_verified = "AI Verified"
    official_approved = "Official Approved"
    rated = "Rated"
    closed = "Closed"
    rejected = "Rejected"
    
    # Aliases for compatibility
    resolved = "Closed"
    in_progress = "Work Started"
    assigned = "Worker Assigned"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_number = Column(String(20), unique=True, nullable=False)
    category = Column(SAEnum(ComplaintCategory), nullable=False)
    description = Column(Text, nullable=False)
    raised_by = Column(String(150), nullable=False)
    raised_by_phone = Column(String(20), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    address = Column(String(300), nullable=True)
    ward_id = Column(Integer, nullable=True)
    status = Column(SAEnum(ComplaintStatus), default=ComplaintStatus.raised)
    priority = Column(String(50), default="Standard") # AI assigns priority
    assigned_supervisor_id = Column(Integer, nullable=True)
    assigned_worker_id = Column(Integer, nullable=True)
    assigned_to = Column(String(150), nullable=True) # Keeping for backward compatibility temporarily
    image_url = Column(String(500), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    citizen_rating = Column(Integer, nullable=True) # 1-5 stars
    raised_at = Column(DateTime(timezone=True), server_default=func.now())
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("idx_complaints_ward_status", "ward_id", "status"),
    )

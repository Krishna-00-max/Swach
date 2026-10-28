from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, func, Float
from backend.database import Base
import enum


class StreetStatus(str, enum.Enum):
    covered = "Covered"
    missed = "Missed"
    in_progress = "In Progress"
    scheduled = "Scheduled"


class Street(Base):
    __tablename__ = "streets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    ward_id = Column(Integer, nullable=False)
    colony_id = Column(Integer, nullable=True) # Phase 5 addition
    status = Column(SAEnum(StreetStatus), default=StreetStatus.scheduled)
    households_count = Column(Integer, default=0)
    assigned_vehicle_id = Column(Integer, nullable=True)
    covered_at = Column(DateTime(timezone=True), nullable=True)
    length_km = Column(Float, default=0.5)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

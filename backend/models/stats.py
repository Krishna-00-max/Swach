from sqlalchemy import Column, Integer, Date, Float, DateTime, func
from backend.database import Base


class DailyStat(Base):
    __tablename__ = "daily_stats"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    ward_id = Column(Integer, nullable=True)
    streets_covered = Column(Integer, default=0)
    streets_total = Column(Integer, default=0)
    households_visited = Column(Integer, default=0)
    complaints_raised = Column(Integer, default=0)
    complaints_resolved = Column(Integer, default=0)
    active_vehicles = Column(Integer, default=0)
    cleanliness_score = Column(Float, default=0.0)
    pending_areas = Column(Integer, default=0)
    waste_collected_kg = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

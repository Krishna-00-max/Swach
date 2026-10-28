from sqlalchemy import Column, Integer, String, DateTime, func
from backend.database import Base


class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    village = Column(String(100), nullable=False, default="Rajpur Gram Panchayat")
    district = Column(String(100), nullable=False, default="Jaipur")
    state = Column(String(100), nullable=False, default="Rajasthan")
    total_streets = Column(Integer, default=0)
    total_households = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Colony(Base):
    __tablename__ = "colonies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    ward_id = Column(Integer, nullable=False, index=True)
    total_households = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

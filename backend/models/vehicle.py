from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SAEnum, JSON, Boolean, func, ForeignKey, Text, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.database import Base
import enum


class VehicleStatus(str, enum.Enum):
    active = "Active"
    delayed = "Delayed"
    offline = "Offline"
    maintenance = "Maintenance"
    breakdown = "Breakdown"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String(20), unique=True, nullable=False)
    vehicle_name = Column(String(100), nullable=False)
    driver_name = Column(String(100), nullable=False)
    driver_phone = Column(String(20), nullable=True)
    driver_id = Column(Integer, nullable=True) # Reference to Worker ID
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    lat = Column(Float, nullable=True, default=16.5131)
    lng = Column(Float, nullable=True, default=80.5165)
    status = Column(SAEnum(VehicleStatus), default=VehicleStatus.offline)
    street_name = Column(String(200), nullable=True)
    speed = Column(Float, default=0.0)
    fuel_efficiency = Column(Float, nullable=True)
    daily_distance_km = Column(Float, default=0.0)
    
    route_history = Column(JSON, default=list) 
    eta = Column(String(50), nullable=True)
    fuel_level = Column(Integer, default=100)
    insurance_expiry_date = Column(DateTime(timezone=True), nullable=True)
    next_maintenance_date = Column(DateTime(timezone=True), nullable=True)
    fuel_efficiency = Column(Float, default=0.0)  # km per liter
    # --- Route Compliance Engine columns ---
    heading = Column(Float, default=0.0)           # bearing 0-360° (north=0)
    on_route = Column(Boolean, default=True)        # within 30m of assigned street?
    behavior_score = Column(Float, default=85.0)    # composite score 0-100
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    maintenance_logs = relationship("MaintenanceLog", backref="vehicle", cascade="all, delete-orphan")
    location_history = relationship("VehicleLocationHistory", backref="vehicle", cascade="all, delete-orphan")


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    description = Column(String(500), nullable=False)
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    completed_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="Scheduled") # Scheduled, In Progress, Completed
    cost = Column(Float, nullable=True)
    mechanic_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class VehicleLocationHistory(Base):
    __tablename__ = "vehicle_location_history"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    speed = Column(Float, default=0.0)
    on_route = Column(Boolean, default=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_location_vehicle_timestamp", "vehicle_id", "timestamp"),
    )


class Route(Base):
    __tablename__ = "routes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    ward_id = Column(Integer, nullable=False, index=True)
    assigned_vehicle_id = Column(Integer, nullable=True)
    street_ids = Column(JSON, default=list) # List of street IDs
    estimated_distance_km = Column(Float, default=0.0)
    estimated_time_mins = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Trip(Base):
    __tablename__ = "trips"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, index=True)
    driver_id = Column(Integer, index=True)
    supervisor_id = Column(Integer, index=True, nullable=True)
    route_id = Column(Integer, index=True, nullable=True)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    planned_route = Column(JSON, default=list) # List of street IDs or lat/lng
    actual_route = Column(JSON, default=list)
    stops_made = Column(Integer, default=0)
    distance_km = Column(Float, default=0.0)
    planned_distance_km = Column(Float, default=0.0)
    idle_time_mins = Column(Integer, default=0)
    missed_streets_count = Column(Integer, default=0)
    compliance_pct = Column(Float, default=100.0)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class TripAssignment(Base):
    __tablename__ = "trip_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, index=True, nullable=False)
    worker_id = Column(Integer, index=True, nullable=False)
    role = Column(String(50), nullable=False) # e.g. Driver, Supervisor, Worker
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("trip_id", "worker_id", "role", name="uq_trip_worker_role"),
    )

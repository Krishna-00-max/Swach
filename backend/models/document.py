from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, func
from backend.database import Base
import enum

class DocumentType(str, enum.Enum):
    route_photo = "Route Photo"
    cctv_image = "CCTV Image"
    daily_report = "Daily Report"
    pdf = "PDF"
    video = "Video"
    employee_doc = "Employee Document"
    driver_license = "Driver License"
    vehicle_doc = "Vehicle Document"
    vehicle_rc = "Vehicle RC"
    vehicle_insurance = "Insurance"
    vehicle_puc = "PUC"
    gov_order = "Gov Order"
    other = "Other"

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    doc_type = Column(SAEnum(DocumentType), default=DocumentType.other)
    url = Column(String(500), nullable=False)
    
    # Polymorphic associations (nullable depending on what the document belongs to)
    worker_id = Column(Integer, index=True, nullable=True)
    vehicle_id = Column(Integer, index=True, nullable=True)
    ward_id = Column(Integer, index=True, nullable=True)
    complaint_id = Column(Integer, index=True, nullable=True)
    trip_id = Column(Integer, index=True, nullable=True)
    
    uploaded_by_id = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

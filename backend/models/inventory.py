from sqlalchemy import Column, Integer, String, DateTime, func, Enum as SAEnum
from backend.database import Base
import enum

class ItemCategory(str, enum.Enum):
    bin = "Public Bin"
    tool = "Tool"
    ppe = "PPE Kit"
    other = "Other"

class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(SAEnum(ItemCategory), default=ItemCategory.other)
    quantity_total = Column(Integer, default=0)
    quantity_deployed = Column(Integer, default=0)
    quantity_damaged = Column(Integer, default=0)
    ward_id = Column(Integer, nullable=True) # If tied to a specific ward
    last_restocked = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

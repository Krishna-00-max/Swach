from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, func
from backend.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True) # Target user, null if broadcast
    role_target = Column(String(50), nullable=True) # E.g., 'supervisor', 'admin'
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    notification_type = Column(String(50), nullable=False) # E.g., 'alert', 'complaint', 'system'
    action_url = Column(String(200), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

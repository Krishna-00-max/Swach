from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum, func, ForeignKey
from backend.database import Base
import enum


class UserRole(str, enum.Enum):
    panchayat_official = "panchayat_official"
    municipal_officer = "municipal_officer"
    supervisor = "supervisor"
    admin = "admin"
    citizen = "citizen"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String(128), unique=True, index=True, nullable=True) # For Firebase Auth
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    hashed_password = Column(String(255), nullable=True) # Optional now if using Firebase
    role = Column(SAEnum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    avatar_initials = Column(String(5), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    __mapper_args__ = {
        "polymorphic_on": role,
        "polymorphic_identity": "user",
        "with_polymorphic": "*",
    }


class Admin(User):
    __tablename__ = "admins"
    id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    admin_level = Column(String(50), default="superadmin")

    __mapper_args__ = {
        "polymorphic_identity": UserRole.admin,
    }


class MunicipalOfficer(User):
    __tablename__ = "municipal_officers"
    id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    district = Column(String(100), nullable=True)

    __mapper_args__ = {
        "polymorphic_identity": UserRole.municipal_officer,
    }


class PanchayatOfficial(User):
    __tablename__ = "panchayat_officials"
    id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    ward_id = Column(Integer, nullable=True)

    __mapper_args__ = {
        "polymorphic_identity": UserRole.panchayat_official,
    }


class Supervisor(User):
    __tablename__ = "supervisors"
    id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    ward_id = Column(Integer, nullable=True)
    assigned_route = Column(String(200), nullable=True)

    __mapper_args__ = {
        "polymorphic_identity": UserRole.supervisor,
    }


class Citizen(User):
    __tablename__ = "citizens"
    id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    ward_id = Column(Integer, nullable=True)

    __mapper_args__ = {
        "polymorphic_identity": UserRole.citizen,
    }

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from typing import List, Dict, Any

from backend.database import get_db
from backend.auth.dependencies import get_current_user
from backend.models.user import User
from backend.models.audit import AuditLog

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.execute(
        select(AuditLog, User.full_name, User.email)
        .outerjoin(User, AuditLog.user_id == User.id)
        .order_by(desc(AuditLog.created_at))
        .limit(limit)
    )
    
    logs = []
    for log, full_name, email in result.all():
        logs.append({
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
            "user": {
                "id": log.user_id,
                "full_name": full_name or "System",
                "email": email or "system@local"
            }
        })
    return logs

@router.get("/users")
async def get_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.execute(select(User).order_by(User.id))
    return result.scalars().all()

@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    payload: Dict[str, str],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    old_role = user.role
    user.role = payload.get("role")
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE_ROLE",
        entity_type="User",
        entity_id=user.id,
        details={"old_role": old_role, "new_role": user.role}
    )
    db.add(audit)
    
    await db.commit()
    return {"message": "Role updated successfully", "user": user}

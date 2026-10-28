from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from backend.services import fcm_service
from backend.auth.dependencies import require_officer_or_admin
from backend.models.user import User

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


class NotificationRequest(BaseModel):
    title: str
    body: str
    topic: str = "all"
    data: Optional[dict] = None


@router.post("/send")
async def send_notification(
    req: NotificationRequest,
    current_user: User = Depends(require_officer_or_admin)
):
    result = await fcm_service.send_notification(
        title=req.title, body=req.body, topic=req.topic, data=req.data
    )
    return result


@router.post("/test")
async def test_notification(current_user: User = Depends(require_officer_or_admin)):
    result = await fcm_service.send_notification(
        title="🧪 Test Notification",
        body="Swachh Surveillance notification system is working!",
        topic="all"
    )
    return result

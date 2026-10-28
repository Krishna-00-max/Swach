import os
import json
from typing import Optional

try:
    import firebase_admin
    from firebase_admin import credentials, messaging

    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-adminsdk.json")
    if os.path.exists(cred_path) and not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    FCM_AVAILABLE = True
except Exception as e:
    print(f"[FCM] Firebase Admin not initialized: {e}")
    FCM_AVAILABLE = False


async def send_notification(title: str, body: str, topic: str = "all", data: Optional[dict] = None):
    if not FCM_AVAILABLE:
        print(f"[FCM Mock] Topic={topic} | {title}: {body}")
        return {"status": "mock_sent", "topic": topic}

    try:
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            topic=topic,
            data={k: str(v) for k, v in (data or {}).items()},
            android=messaging.AndroidConfig(priority="high"),
        )
        response = messaging.send(message)
        return {"status": "sent", "message_id": response}
    except Exception as e:
        return {"status": "error", "error": str(e)}


async def send_new_complaint_notification(complaint_number: str, ward_id: int, category: str):
    return await send_notification(
        title="🚨 New Complaint Registered",
        body=f"[{complaint_number}] {category} reported in Ward {ward_id}",
        topic="supervisors",
        data={"type": "new_complaint", "complaint_number": complaint_number, "ward_id": str(ward_id)}
    )


async def send_vehicle_offline_notification(vehicle_number: str, street: str):
    return await send_notification(
        title="⚠️ Vehicle Offline",
        body=f"Vehicle {vehicle_number} went offline on {street}",
        topic="officers",
        data={"type": "vehicle_offline", "vehicle": vehicle_number}
    )


async def send_missed_street_alert(ward_id: int, street_count: int):
    return await send_notification(
        title="📍 Streets Missed Alert",
        body=f"{street_count} streets not covered in Ward {ward_id} today",
        topic="panchayat",
        data={"type": "missed_streets", "ward_id": str(ward_id), "count": str(street_count)}
    )


async def send_cleanliness_drop_alert(score: float):
    return await send_notification(
        title="📉 Cleanliness Score Dropped",
        body=f"Cleanliness score fell to {score:.1f}/100. Immediate action required.",
        topic="officers",
        data={"type": "score_drop", "score": str(score)}
    )

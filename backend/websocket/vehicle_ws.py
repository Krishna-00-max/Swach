import asyncio
import json
from typing import Set, Dict, Optional
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy import select

from backend.database import AsyncSessionLocal
from backend.models.vehicle import Vehicle
from backend.models.user import User
from backend.auth.jwt import decode_token


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        # Optional: per-ward subscriptions {ward_id: set of ws}
        self._ward_subs: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, ward_id: Optional[int] = None):
        await websocket.accept()
        self.active_connections.add(websocket)
        if ward_id:
            self._ward_subs.setdefault(ward_id, set()).add(websocket)
        print(f"[WS] Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        for ws_set in self._ward_subs.values():
            ws_set.discard(websocket)
        print(f"[WS] Client disconnected. Total: {len(self.active_connections)}") 

    async def broadcast(self, message: dict):
        """Broadcast to ALL connected clients."""
        if not self.active_connections:
            return
        data = json.dumps(message)
        disconnected = set()
        for ws in self.active_connections.copy():
            try:
                await ws.send_text(data)
            except Exception:
                disconnected.add(ws)
        for ws in disconnected:
            self.active_connections.discard(ws)

    async def broadcast_to_ward(self, ward_id: int, message: dict):
        """Broadcast only to clients subscribed to a specific ward."""
        ws_set = self._ward_subs.get(ward_id, set())
        if not ws_set:
            return
        data = json.dumps(message)
        disconnected = set()
        for ws in ws_set.copy():
            try:
                await ws.send_text(data)
            except Exception:
                disconnected.add(ws)
        for ws in disconnected:
            ws_set.discard(ws)
            self.active_connections.discard(ws)


manager = ConnectionManager()


async def vehicle_websocket_handler(websocket: WebSocket):
    """
    Main WebSocket handler with token authentication.
    Supports optional ?ward_id=N query param for filtered subscriptions.
    Expects ?token=JWT_TOKEN query param.
    """
    qs = websocket.query_params
    token = qs.get("token")
    
    if not token:
        await websocket.accept()
        await websocket.close(code=4008, reason="Missing authentication token")
        return
        
    payload = decode_token(token)
    if not payload:
        await websocket.accept()
        await websocket.close(code=4008, reason="Invalid authentication token")
        return
        
    user_id = payload.get("sub")
    if not user_id:
        await websocket.accept()
        await websocket.close(code=4008, reason="Invalid token payload")
        return
        
    # Check if user exists and is active
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == int(user_id)))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            await websocket.accept()
            await websocket.close(code=4008, reason="User unauthorized or inactive")
            return

    # Parse optional ward_id from query string
    ward_id: Optional[int] = None
    if "ward_id" in qs:
        try:
            ward_id = int(qs["ward_id"])
        except ValueError:
            pass

    await manager.connect(websocket, ward_id=ward_id)

    try:
        # ── Send initial vehicle snapshot on connect ──────────────────────────
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Vehicle))
            vehicles = result.scalars().all()
            initial_data = [
                {
                    "id": v.id,
                    "vehicle_number": v.vehicle_number,
                    "vehicle_name": v.vehicle_name,
                    "driver_name": v.driver_name,
                    "driver_phone": v.driver_phone,
                    "lat": v.lat,
                    "lng": v.lng,
                    "status": v.status.value,
                    "street_name": v.street_name,
                    "speed": v.speed,
                    "ward_id": v.ward_id,
                    "eta": v.eta,
                    "fuel_level": v.fuel_level,
                    "heading": v.heading or 0.0,
                    "on_route": v.on_route if v.on_route is not None else True,
                    "behavior_score": v.behavior_score or 85.0,
                    "route_history": v.route_history or [],
                    "last_updated": v.last_updated.isoformat() if v.last_updated else None,
                }
                for v in vehicles
            ]
        await websocket.send_text(json.dumps({"type": "initial", "vehicles": initial_data}))

        # ── Main message loop ─────────────────────────────────────────────────
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                msg = json.loads(data)
                msg_type = msg.get("type")

                if msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                elif msg_type == "subscribe_ward":
                    new_ward = msg.get("ward_id")
                    if new_ward:
                        manager._ward_subs.setdefault(new_ward, set()).add(websocket)

            except asyncio.TimeoutError:
                # Heartbeat to keep connection alive
                await websocket.send_text(json.dumps({"type": "heartbeat"}))
            except WebSocketDisconnect:
                break

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)


async def broadcast_vehicle_update(vehicle_data: dict):
    """Called when a vehicle is updated via REST API."""
    await manager.broadcast({"type": "vehicle_update", "vehicle": vehicle_data})

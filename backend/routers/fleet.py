from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from backend.database import get_db
from backend.models.vehicle import Vehicle
from backend.models.inventory import InventoryItem
from backend.auth.dependencies import get_current_active_user
from backend.models.user import User

router = APIRouter(prefix="/api/fleet", tags=["Fleet"])


@router.get("/vehicles")
async def get_fleet_vehicles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Vehicle))
    return result.scalars().all()


@router.get("/inventory")
async def get_inventory(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(InventoryItem))
    return result.scalars().all()


@router.get("/stats")
async def get_fleet_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    v_result = await db.execute(select(Vehicle))
    vehicles = v_result.scalars().all()

    i_result = await db.execute(select(InventoryItem))
    inventory = i_result.scalars().all()

    active_vehicles = sum(1 for v in vehicles if v.status == "Active")
    maintenance_vehicles = sum(1 for v in vehicles if v.status == "Maintenance")

    total_bins = sum(i.quantity_total for i in inventory if i.category == "Public Bin")
    damaged_bins = sum(i.quantity_damaged for i in inventory if i.category == "Public Bin")

    return {
        "vehicles_total": len(vehicles),
        "vehicles_active": active_vehicles,
        "vehicles_maintenance": maintenance_vehicles,
        "total_bins": total_bins,
        "damaged_bins": damaged_bins
    }

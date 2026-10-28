import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

logger = logging.getLogger("swach.gis")

_POSTGIS_AVAILABLE: Optional[bool] = None

async def is_postgis_available(db: AsyncSession) -> bool:
    """Check if PostGIS is available on the database connection."""
    global _POSTGIS_AVAILABLE
    if _POSTGIS_AVAILABLE is not None:
        return _POSTGIS_AVAILABLE

    try:
        # Check if ST_MakePoint is executable
        result = await db.execute(text("SELECT ST_IsValid(ST_MakePoint(0, 0))"))
        await result.scalar()
        _POSTGIS_AVAILABLE = True
        logger.info("PostGIS spatial engine is available and active.")
    except Exception:
        _POSTGIS_AVAILABLE = False
        logger.warning("PostGIS is not available. Falling back to CPU-based Haversine calculations.")
    
    return _POSTGIS_AVAILABLE


async def check_vehicle_on_route(
    db: AsyncSession,
    v_lat: float,
    v_lng: float,
    ward_id: int,
    threshold_m: float = 30.0
) -> Optional[bool]:
    """
    Checks if a vehicle is within `threshold_m` of any street point in its ward.
    Leverages PostGIS ST_DWithin if available, otherwise returns None (caller fallback).
    """
    postgis_ok = await is_postgis_available(db)
    if not postgis_ok:
        return None

    try:
        # Use PostGIS ST_DWithin on the geography points
        query = text("""
            SELECT EXISTS (
                SELECT 1 FROM streets 
                WHERE ST_DWithin(
                    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
                    ST_SetSRID(ST_MakePoint(:v_lng, :v_lat), 4326)::geography,
                    :threshold_m
                ) AND ward_id = :ward_id
            )
        """)
        result = await db.execute(query, {
            "v_lng": v_lng,
            "v_lat": v_lat,
            "threshold_m": threshold_m,
            "ward_id": ward_id
        })
        return await result.scalar()
    except Exception as e:
        logger.error(f"PostGIS check failed, falling back: {e}")
        return None


async def initialize_postgis_setup(db: AsyncSession):
    """Enable PostGIS extension and create GiST indexes if supported."""
    try:
        # Try to create extension (requires superuser, might warn/fail if already enabled or offline)
        await db.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        await db.commit()
    except Exception as e:
        logger.info(f"CREATE EXTENSION postgis skipped/failed (expected on local SQLite or limited user): {e}")

    postgis_ok = await is_postgis_available(db)
    if not postgis_ok:
        return

    # Create GiST indexes for streets and vehicle location history
    try:
        await db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_streets_spatial 
            ON streets USING gist (
                (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography)
            );
        """))
        await db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_location_history_spatial 
            ON vehicle_location_history USING gist (
                (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography)
            );
        """))
        await db.commit()
        logger.info("GiST spatial indexes created successfully.")
    except Exception as e:
        logger.error(f"Failed to create GiST spatial indexes: {e}")
        await db.rollback()

import asyncio
import sys
import os

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.database import engine
from sqlalchemy import text

async def upgrade_db():
    print("Upgrading database...")
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_expiry_date TIMESTAMP WITH TIME ZONE;"))
        await conn.execute(text("ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS next_maintenance_date TIMESTAMP WITH TIME ZONE;"))
        await conn.execute(text("ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_efficiency FLOAT DEFAULT 0.0;"))
    print("Database upgrade complete!")

if __name__ == "__main__":
    asyncio.run(upgrade_db())

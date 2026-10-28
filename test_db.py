"""Quick DB connection test — run from the swach/ root directory:
   py test_db.py
"""
import asyncio
import asyncpg

DATABASE_URL = (
    "postgresql://neondb_owner:npg_nEfM2PCByp3d"
    "@ep-late-star-aojyb6nv.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
)


async def test():
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        version = await conn.fetchval("SELECT version()")
        print(f"✅ Connected to Neon PostgreSQL!")
        print(f"   {version[:60]}...")
        await conn.close()
    except Exception as e:
        print(f"❌ Connection failed: {e}")


asyncio.run(test())

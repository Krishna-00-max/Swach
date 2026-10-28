import asyncio
from backend.database import engine, Base
import backend.models  # noqa

async def reset_db():
    async with engine.connect() as conn:
        trans = await conn.begin()
        print("Dropping all tables with CASCADE...")
        try:
            # Drop all tables including the user sub-tables (joined table inheritance)
            await conn.execute(text("""
                DROP TABLE IF EXISTS 
                    fcm_tokens, payroll, inventory, daily_stats, notifications,
                    complaints, streets, colonies, trips, trip_assignments, routes, documents, vehicle_location_history, maintenance_logs, vehicles, workers, wards,
                    audit_logs, admins, municipal_officers, panchayat_officials, supervisors, citizens,
                    users
                CASCADE
            """))
            print("Executing manual DROP TYPE for enums...")
            await conn.execute(text("DROP TYPE IF EXISTS userrole CASCADE"))
            await conn.execute(text("DROP TYPE IF EXISTS vehiclestatus CASCADE"))
            await conn.execute(text("DROP TYPE IF EXISTS complaintstatus CASCADE"))
            await conn.execute(text("DROP TYPE IF EXISTS complaintcategory CASCADE"))
            await conn.execute(text("DROP TYPE IF EXISTS itemcategory CASCADE"))
            await conn.execute(text("DROP TYPE IF EXISTS attendancestatus CASCADE"))
            await conn.execute(text("DROP TYPE IF EXISTS streetstatus CASCADE"))
            await conn.execute(text("DROP TYPE IF EXISTS payrollstatus CASCADE"))
            await conn.execute(text("DROP TYPE IF EXISTS documenttype CASCADE"))
            await trans.commit()
        except Exception as e:
            print(f"Warn during drops: {e}")
            await trans.rollback()
            
        trans2 = await conn.begin()
        print("Creating all tables...")
        await conn.run_sync(Base.metadata.create_all)
        await trans2.commit()
        print("Done!")

if __name__ == "__main__":
    from sqlalchemy import text
    asyncio.run(reset_db())


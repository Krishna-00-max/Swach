import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import settings
from backend.database import init_db, AsyncSessionLocal
from backend.services.seed_service import seed_data
from backend.services.gps_simulator import start_simulator, stop_simulator
from backend.websocket.vehicle_ws import vehicle_websocket_handler
from backend.routers import auth, vehicles, fleet, streets, complaints, stats, ai, workers, payroll, notifications, admin, trips, documents


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────────────────
    print(f"[{settings.APP_NAME}] Starting up...")
    await init_db()
    async with AsyncSessionLocal() as db:
        await seed_data(db)
        from backend.services.gis_service import initialize_postgis_setup
        await initialize_postgis_setup(db)
        await db.commit()

    # Start GPS simulator background task
    sim_task = start_simulator()
    print(f"[{settings.APP_NAME}] GPS Simulator started.")
    print(f"[{settings.APP_NAME}] Ready! Visit http://localhost:8000/docs")

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    stop_simulator()
    print(f"[{settings.APP_NAME}] Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Government-grade Village Waste Management Surveillance API — Smart Route Compliance Engine",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip() and o.strip() != "*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth)
app.include_router(vehicles)
app.include_router(streets)
app.include_router(complaints)
app.include_router(workers)
app.include_router(stats)
app.include_router(ai)
app.include_router(fleet)
app.include_router(payroll)
app.include_router(notifications)
app.include_router(admin.router)
app.include_router(trips.router)
app.include_router(documents)

# ── Static Uploads ────────────────────────────────────────────────────────────
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── WebSocket ─────────────────────────────────────────────────────────────────
@app.websocket("/ws/vehicles")
async def vehicles_ws(websocket: WebSocket):
    await vehicle_websocket_handler(websocket)


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs",
        "features": ["route_compliance", "gps_simulator", "behavior_scoring", "real_time_alerts"],
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "service": settings.APP_NAME}

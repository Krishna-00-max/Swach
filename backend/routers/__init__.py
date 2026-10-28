from backend.routers.auth import router as auth_router
from backend.routers.vehicles import router as vehicles_router
from backend.routers.streets import router as streets_router
from backend.routers.complaints import router as complaints_router
from backend.routers.workers import router as workers_router
from backend.routers.stats import router as stats_router
from backend.routers.ai import router as ai_router
from backend.routers.notifications import router as notifications_router
from backend.routers.fleet import router as fleet_router
from backend.routers.payroll import router as payroll_router
from backend.routers.documents import router as documents_router

auth = auth_router
vehicles = vehicles_router
streets = streets_router
complaints = complaints_router
workers = workers_router
stats = stats_router
ai = ai_router
notifications = notifications_router
fleet = fleet_router
payroll = payroll_router
documents = documents_router

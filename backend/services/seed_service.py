"""Seed realistic sample data for Swachh Surveillance."""
import random
from datetime import datetime, timedelta, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.models.ward import Ward
from backend.models.vehicle import Vehicle, VehicleStatus
from backend.models.street import Street, StreetStatus
from backend.models.complaint import Complaint, ComplaintCategory, ComplaintStatus
from backend.models.worker import Worker, AttendanceStatus
from backend.models.stats import DailyStat
from backend.models.user import User, UserRole, Admin, MunicipalOfficer, PanchayatOfficial, Supervisor, Citizen
from backend.auth.jwt import get_password_hash

# Amaravati, Andhra Pradesh base coordinates
BASE_LAT, BASE_LNG = 16.5131, 80.5165

WARD_NAMES = [
    "Ward 1 - Benz Circle Area", "Ward 2 - Patamata Block", "Ward 3 - Gunadala Heights",
    "Ward 4 - Moghalrajpuram Hills", "Ward 5 - Governorpet Center", "Ward 6 - Vidyadharapuram Zone",
    "Ward 7 - Bhavanipuram Sector", "Ward 8 - One Town Old Bazar"
]

STREET_NAMES = [
    "Kanaka Durga Temple Street", "Rythu Bazar Road", "Eluru Road", "MG Road", "Secretariat Lane",
    "Prakasam Barrage Path", "NTR Marg", "YSR Road", "Krishna Canal Bank Road", "High Court Access Road",
    "Gandhi Chowk Gali", "Srinivasa Street", "Venkateswara Colony Lane", "Amaravati Main Road",
    "Police Station Lane", "Bhavani Island Road", "Srinivasa Nagar Road", "Benz Circle Flyover Side Road",
    "One Town Bazar Street", "Ramavarappadu Ring Road"
]

DRIVER_NAMES = [
    "Srinivas Rao", "Venkatesh", "Ravi Teja", "Nagarjuna",
    "Kalyan Ram", "Satyanarayana"
]

WORKER_NAMES = [
    "Rambabu", "Lakshmi", "Chitti Babu", "Vara Lakshmi",
    "Durgarao", "Subba Rao", "Anji Reddy", "Sita Devi",
    "Kumari", "Nageswara Rao", "Koteswara Rao", "Purnachandra Rao",
    "Rajeswari", "Kalyani", "Ranga Rao"
]


async def seed_data(db: AsyncSession):
    """Seed all sample data if tables are empty."""
    # Check if already seeded
    result = await db.execute(select(func.count()).select_from(Ward))
    if result.scalar() > 0:
        print("[Seed] Data already exists, skipping seed.")
        return

    print("[Seed] Seeding sample data...")

    # 1. Wards
    wards = []
    for i, name in enumerate(WARD_NAMES, 1):
        ward = Ward(name=name, village="Amaravati Gram Panchayat",
                    total_streets=random.randint(4, 6), total_households=random.randint(120, 300))
        db.add(ward)
        wards.append(ward)
    await db.flush()
    ward_ids = [w.id for w in wards]

    # 2. Default users
    users = [
        Admin(full_name="Admin Officer", email="admin@swachh.gov.in",
             hashed_password=get_password_hash("Admin@123"), role=UserRole.admin, avatar_initials="AO"),
        MunicipalOfficer(full_name="Prakash Sharma", email="officer@swachh.gov.in",
             hashed_password=get_password_hash("Officer@123"), role=UserRole.municipal_officer, avatar_initials="PS"),
        PanchayatOfficial(full_name="Sanjay Panchayat", email="panchayat@swachh.gov.in",
             hashed_password=get_password_hash("Panchayat@123"), role=UserRole.panchayat_official, avatar_initials="SP"),
        Supervisor(full_name="Ramesh Supervisor", email="supervisor@swachh.gov.in",
             hashed_password=get_password_hash("Super@123"), role=UserRole.supervisor, avatar_initials="RS"),
        Citizen(full_name="Anil Citizen", email="citizen@swachh.gov.in",
             hashed_password=get_password_hash("Citizen@123"), role=UserRole.citizen, avatar_initials="AC", ward_id=ward_ids[0]),
    ]
    for u in users:
        db.add(u)

    # 3. Vehicles
    statuses = [VehicleStatus.active, VehicleStatus.active, VehicleStatus.active,
                VehicleStatus.delayed, VehicleStatus.delayed, VehicleStatus.offline]
    vehicles = []
    for i, driver in enumerate(DRIVER_NAMES):
        v = Vehicle(
            vehicle_number=f"AP16-TJ-{2001+i}",
            vehicle_name=f"Waste Truck {i+1}",
            driver_name=driver,
            driver_phone=f"98{random.randint(10000000, 99999999)}",
            lat=BASE_LAT + random.uniform(-0.05, 0.05),
            lng=BASE_LNG + random.uniform(-0.05, 0.05),
            status=statuses[i],
            street_name=random.choice(STREET_NAMES),
            speed=random.uniform(5, 25) if statuses[i] == VehicleStatus.active else 0,
            ward_id=ward_ids[i % len(ward_ids)],
            eta=f"{random.randint(10, 90)} min",
            fuel_level=random.randint(30, 100),
            route_history=[
                {"lat": BASE_LAT + random.uniform(-0.03, 0.03),
                 "lng": BASE_LNG + random.uniform(-0.03, 0.03),
                 "ts": (datetime.utcnow() - timedelta(minutes=j*5)).isoformat()}
                for j in range(10, 0, -1)
            ]
        )
        db.add(v)
        vehicles.append(v)

    # 4. Streets
    statuses_street = [StreetStatus.covered] * 28 + [StreetStatus.missed] * 8 + [StreetStatus.in_progress] * 4
    random.shuffle(statuses_street)
    for idx in range(40):
        ward_id = ward_ids[idx % len(ward_ids)]
        street = Street(
            name=f"{random.choice(STREET_NAMES)} {idx+1}",
            ward_id=ward_id,
            status=statuses_street[idx],
            households_count=random.randint(15, 60),
            assigned_vehicle_id=random.randint(1, 6),
            covered_at=datetime.utcnow() - timedelta(hours=random.randint(1, 8)) if statuses_street[idx] == StreetStatus.covered else None,
            length_km=round(random.uniform(0.3, 1.5), 2),
            lat=BASE_LAT + random.uniform(-0.06, 0.06),
            lng=BASE_LNG + random.uniform(-0.06, 0.06),
        )
        db.add(street)

    # 5. Complaints
    categories = list(ComplaintCategory)
    complaint_statuses = [ComplaintStatus.resolved] * 15 + [ComplaintStatus.in_progress] * 8 + \
                         [ComplaintStatus.raised] * 7 + [ComplaintStatus.assigned] * 5
    random.shuffle(complaint_statuses)
    for i in range(35):
        days_ago = random.randint(0, 14)
        status = complaint_statuses[i]
        c = Complaint(
            complaint_number=f"CMP-{100001+i}",
            category=random.choice(categories),
            description=f"Issue reported by resident in ward area. Immediate attention required.",
            raised_by=random.choice(WORKER_NAMES),
            raised_by_phone=f"97{random.randint(10000000, 99999999)}",
            lat=BASE_LAT + random.uniform(-0.05, 0.05),
            lng=BASE_LNG + random.uniform(-0.05, 0.05),
            address=f"{random.choice(STREET_NAMES)}, Ward {random.choice(ward_ids)}",
            ward_id=random.choice(ward_ids),
            status=status,
            assigned_to="Ramesh Supervisor" if status != ComplaintStatus.raised else None,
            raised_at=datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 12)),
            resolved_at=datetime.utcnow() - timedelta(days=random.randint(0, days_ago)) if status == ComplaintStatus.resolved else None,
        )
        db.add(c)

    # 6. Workers
    worker_statuses = [AttendanceStatus.present] * 11 + [AttendanceStatus.absent] * 2 + [AttendanceStatus.leave] * 2
    random.shuffle(worker_statuses)
    for i, name in enumerate(WORKER_NAMES):
        tasks_total = random.randint(8, 15)
        tasks_done = random.randint(0, tasks_total) if worker_statuses[i] == AttendanceStatus.present else 0
        w = Worker(
            name=name,
            employee_id=f"EMP{1001+i}",
            phone=f"99{random.randint(10000000, 99999999)}",
            ward_id=ward_ids[i % len(ward_ids)],
            assigned_route=f"Route {chr(65+i)} - {random.choice(STREET_NAMES)}",
            attendance=worker_statuses[i],
            tasks_completed=tasks_done,
            tasks_total=tasks_total,
            performance_score=round(tasks_done / tasks_total * 100, 1) if tasks_total > 0 else 0,
            shift_start="06:00",
            shift_end="14:00",
        )
        db.add(w)

    # 7. Daily Stats (last 30 days)
    for day_offset in range(30):
        d = date.today() - timedelta(days=day_offset)
        score = random.uniform(65, 95)
        stat = DailyStat(
            date=d,
            ward_id=None,
            streets_covered=random.randint(25, 38),
            streets_total=40,
            households_visited=random.randint(800, 1400),
            complaints_raised=random.randint(3, 18),
            complaints_resolved=random.randint(2, 15),
            active_vehicles=random.randint(3, 6),
            cleanliness_score=round(score, 1),
            pending_areas=random.randint(2, 12),
            waste_collected_kg=random.uniform(1200, 3500),
        )
        db.add(stat)

    await db.flush()
    print("[Seed] Sample data seeded successfully!")
    print("[Seed] Default logins:")
    print("[Seed]   admin@swachh.gov.in / Admin@123")
    print("[Seed]   officer@swachh.gov.in / Officer@123")
    print("[Seed]   panchayat@swachh.gov.in / Panchayat@123")
    print("[Seed]   supervisor@swachh.gov.in / Super@123")

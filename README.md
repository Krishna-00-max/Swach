# 🌿 Swachh Surveillance — Gram Panchayat Waste Management System

A high-fidelity, production-ready, government-grade digital surveillance platform designed for **Gram Panchayat Waste Management** under the **Swachh Bharat Mission (Gramin)**.

The system features real-time IoT GPS vehicle tracking via MapLibre, role-based dashboards, a centralized Citizen Services portal, an AI-powered complaint verification pipeline, worker performance leaderboards, automatic payroll calculation, and automated Gemini AI sanitation recommendations.

---

## 🗺️ Project Scope: Amaravati & Vijayawada Region, Andhra Pradesh
The platform is pre-configured and seeded with real-world geographical details representing the **Amaravati Gram Panchayat** in the Vijayawada Region of Andhra Pradesh.

---

## 👥 Role-Based Access Control (RBAC) & Restrictions

Swachh Surveillance employs a strict RBAC architecture to ensure data security and maintain the administrative hierarchy. 

### How Roles are Restricted:
1. **Frontend (React Router Guards)**: We use a custom `RoleRoute` guard component in `App.jsx`. It intercepts every route transition and checks the JWT token payload. If a user tries to access a URL not explicitly permitted in the `ROUTE_ROLES` matrix, they are instantly redirected to an `/unauthorized` page.
2. **Backend (FastAPI Dependencies)**: Every protected API endpoint uses the `require_any_role` dependency injection (e.g., `Depends(require_any_role(["admin", "municipal_officer"]))`). This prevents unauthorized API calls even if a malicious user bypasses the frontend routing.
3. **Database Level Segregation**: In some views (like the Supervisor dashboard), the backend automatically filters queries based on the user's assigned `ward_id`, ensuring a supervisor only sees data relevant to their specific ward.

### Role Matrix & Capabilities:

| Role | Default Email | What They Can Do (Capabilities) |
| :--- | :--- | :--- |
| **Admin** | `admin@swachh.gov.in` | **Full God-Mode Access.**<br/>• Access the **System Administration** panel to change user roles dynamically.<br/>• View immutable **Security Audit Logs** of all critical system actions.<br/>• Full access to Fleet Management, Payroll generation, Analytics, and all AI features. |
| **Municipal Officer** | `officer@swachh.gov.in` | **High-Level Oversight & Reporting.**<br/>• View global analytics, complaint heatmaps, and financial payroll trends.<br/>• Export coverage reports to PDF/Excel.<br/>• Interact with Gemini AI for predictive bin overflows and official report generation.<br/>• *Restricted from*: Changing user roles, viewing system audit logs, or modifying worker daily attendance. |
| **Panchayat Official** | `panchayat@swachh.gov.in` | **Local Village Operations.**<br/>• View overall dashboard metrics.<br/>• Track live vehicles on the map.<br/>• View and comment on citizen complaints.<br/>• *Restricted from*: Fleet maintenance scheduling, payroll processing, and high-level analytics views. |
| **Supervisor** | `supervisor@swachh.gov.in` | **Field Operation Management.**<br/>• Manage worker attendance and shift rosters (for their assigned ward).<br/>• Track live garbage trucks.<br/>• Resolve and update complaint statuses.<br/>• *Restricted from*: Global analytics, payroll, system administration, and viewing data outside their ward. |
| **Citizen** | `citizen@swachh.gov.in` | **Public Portal Access.**<br/>• Submit geotagged sanitation complaints (`/report-issue`).<br/>• Track the live status and official responses of their own complaints (`/track-issue`).<br/>• View the public Live GPS Tracking map to see where active trucks are.<br/>• *Restricted from*: Absolutely all administrative features, internal stats, AI insights, and other citizens' data. |

---

## 🚀 Recent Updates (Enterprise Features)

We recently completed **Phases 1 through 8** of the enterprise roadmap, introducing several advanced features:

### 1. System Administration & Audit Logs (Phase 2)
- Added an Admin-exclusive `/admin` portal.
- **Dynamic Role Management**: Admins can change user access levels on the fly.
- **Immutable Audit Trails**: Every time a role is changed or a critical action occurs, the system logs the timestamp, IP, User ID, and old/new JSON details into the `AuditLog` table, preventing unauthorized tampering.

### 2. Advanced Fleet Management & Maintenance (Phase 2)
- Added a new **Maintenance Scheduler** tab in the Fleet Management dashboard.
- Managers can log upcoming oil changes, inspections, and view historical repair costs per vehicle (`MaintenanceLog` model).

### 3. AI Route Optimization & GPS Replay (Phase 3)
- **AI Route Optimization Overlay**: Added an "AI Optimize Route" button to the Vehicle Tracking map. This simulates calculating the most efficient, traffic-aware route and renders it dynamically on the MapLibre view.
- **Route Replay**: Expanded the backend to record high-fidelity GPS breadcrumbs (`VehicleLocationHistory`). The frontend parses this `route_history` to draw a glowing trail behind active vehicles, allowing managers to see exactly where a driver has been.

### 4. Smart UI & PWA (Phase 1 & 3)
- **Global Notification Center**: A persistent header dropdown that aggregates system alerts and updates.
- **Complaint Density Heatmaps**: Visualizes high-frequency complaint zones in the Analytics page.
- **Vite PWA (Offline Sync)**: Configured the frontend as a Progressive Web App with caching Service Workers, ensuring the dashboard remains usable during temporary field network drops.

### 5. Advanced Employee & Trip Management (Phase 4)
- **Trip Tracking**: Transitioned from raw GPS pings to managed end-to-end `Trip` sessions for garbage trucks, calculating compliance and idle time.
- **Employee Profile Module**: Completely overhauled the `/workers` dashboard to support tabbed views for Attendance, Leave Management, Performance Radar Charts, Estimated Salary, and Training Records.

### 6. Ward Coverage & Operations (Phase 5)
- **Granular GIS Models**: Added `Colony` mapping and `house_count` tracking to accurately measure waste collection penetration.
- **Coverage Module**: A dedicated `/coverage` page visualizing daily operational progress across wards and flagging missed streets.
- **Media Tracking**: Introduced a polymorphic `Document` schema to track route photos, CCTV snapshots, and official reports.

### 7. GIS Command Center & AI Priorities (Phase 6 & 7)
- **Dashboard Overhaul**: Redesigned the primary Dashboard into a "Command Center" featuring a large interactive GIS operations map placeholder with layer toggles (Boundaries, Heatmaps, Live Vehicles).
- **AI Complaint Prioritization**: Re-architected the `ComplaintStatus` workflow to inject AI automatically for issue categorization, prioritization (Standard vs High), and official verification routing.
- **Automated Notifications**: Built a robust `Notification` schema for handling background triggers (e.g., geofence alerts, missing trucks, unresolved tickets).

### 8. Executive Enterprise Expansion (Phase 8)
- **Executive Dashboard**: A specialized `municipal_officer` overview detailing District Cleanliness, Fleet Status, Best/Worst Wards, Complaint Trends, and Attendance Summary.
- **Route Planning & Compliance**: New `/routes` module for Supervisors and Admins to assign vehicles, drivers, and supervisors to specific planned routes.
- **Digital Document Center**: Centralized `/documents` repository managing Vehicle RC, Insurance, PUC, Driver Licenses, and Gov Orders with secure categorization.
- **Citizen Rating Workflow**: Citizens can now submit 5-star ratings and feedback on resolved tickets via the Track Issue portal.
- **Advanced AI Insights**: Upgraded Gemini integrations to provide Maintenance Predictions, Fuel Analytics, and Trend Analysis alongside Missed Street Alerts.

---

## 📋 Comprehensive Feature Catalog

### 1. Dashboard & KPIs
- **8 Core Metrics**: Active trucks, streets covered, active workers present, pending complaints, daily waste collected, and cleanliness index score.
- **Coverage Charts**: Visual representation of weekly progress and comparative ward performance.

### 2. Live Vehicle Tracking
- Web Map interface centered on Amaravati, AP using MapLibre GL.
- WebSocket integration (`/ws/vehicles`) streaming live GPS updates to the admin/officer dashboard and citizen portal.
- Driver information panel detailing speed, ETA, fuel levels, AI Optimization overlays, and history path trails.

### 3. Complaints & Grievance Pipeline
- Interactive board categorizing tickets into **Raised**, **Assigned**, **In Progress**, and **Resolved**.
- **AI-Powered Cleanliness Verification**: Integrated with AI to scan upload photo URLs of cleaned areas, validating if they meet municipal standards before resolving tickets.

### 4. Worker Attendance & Rosters
- Clock-in status tracking (Present, Absent, Leave).
- Performance leaderboard calculating completed tasks versus total assigned streets.

### 5. Fleet & Inventory Management
- Tracking of vehicle maintenance alerts, insurance expiry dates, and fuel efficiency.
- Public bin stock levels (total bins, deployed, damaged).

### 6. Payroll & Performance Bonuses
- Automated salary generation based on monthly attendance days.
- Bonus calculation mapped to performance scores (percentage of successfully covered streets).

### 7. Gemini AI Insights & Reports
- **Official Roster Recommendations**: Daily automated scheduling suggestions.
- **Predictive Analytics**: Maintenance Predictions, Fuel Analytics, Trend Analysis, and Overflow Warnings.
- **Sanitation AI Chatbot**: Interactive Q&A via Gemini 1.5 Flash.

### 8. Digital Document Center
- **Centralized Storage**: Secure uploads for KYC, Vehicle Documents (RC, PUC, Insurance), and Evidence Media.

### 9. Route & Trip Management
- **Trip Compliance**: Tracks actual vs. planned routes, missed streets, and extra distance covered by drivers.

---

## 🏗️ Architecture & Technology Stack

- **Backend**: FastAPI, SQLAlchemy (Asyncio), PostgreSQL (Neon Cloud DB), asyncpg, Pydantic v2.
- **Frontend**: React 18, Vite, React Router DOM, MapLibre GL, Recharts, Lucide icons, Vite PWA.

---

## 🚀 Installation & Running Locally

### Step 1: Clone and Configure Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Setup the environment configuration in `backend/.env`.

### Step 2: Database Initialization & Seeding
Wipe the existing database and auto-seed the new geographical mock dataset (including new Phase 2/3 tables like Audit Logs and Maintenance Logs):
```bash
python reset_db.py
```

### Step 3: Run the Services

#### Start Backend:
```bash
python -m uvicorn backend.main:app --reload --port 8000
```

#### Start Frontend:
```bash
cd frontend
npm install
npm run dev
```

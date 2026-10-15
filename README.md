# GeoTrace GIS - Pipeline Infrastructure Management System

A mobile-first web application for pipeline infrastructure management, field data capture, and GIS visualization.

## Features

### 🗺️ Mobile-First GIS Interface
- Responsive bottom navigation (Dashboard, Projects, Map View, CAD View, Capture, Settings)
- Desktop sidebar with collapsible navigation
- Touch-friendly UI with 48px+ tap targets

### 📍 Project Management
- Create/edit projects with geolocation lookup (Khandari Agra → 27.200000, 78.010000)
- Hardcoded CRS: EPSG:4326 (WGS84)
- Address auto-geocoding with spatial bounds

### 📊 Pipeline Asset Tracking
- Create pipeline assets (Water, Gas, Sewage, Electrical, Telecom)
- Material, diameter, installation date, status tracking
- Hierarchical project → asset → segment structure

### 🗺️ Map View (Leaflet + React-Leaflet)
- OpenStreetMap base layer
- Planned (dashed blue) vs As-Built (solid green) line overlays
- Layer toggles for Planned/As-Built/Approved geometries
- **Offline CAD fallback** - SVG-based vector rendering when tiles unavailable

### 📐 CAD Cross-Section Profile (`/projects/:id/cad`)
- True underground depth cross-section visualization
- Ground surface baseline (0.0m)
- Pipeline at -1.2m depth with realistic HDPE rendering
- Soil layers: Topsoil → Subsoil → Bedrock
- Deviation alert: 2.4m horizontal drift warning bubble
- Engineering properties panel (10 CAD properties)

### 📹 Live Field Video Capture
- Camera capture with `capture="environment"` (rear camera)
- AI processing simulation: "Processing Frame Hashes..." → "Depth Extracted: 1.2m"
- SHA-256 hash generation for evidence integrity
- Warning: "⚠️ Live Field Capture Only: Point camera directly at exposed trench line"

### 🔐 Authentication (Bypassed for Demo)
- Contractor role with full field permissions
- Auto-login with seeded credentials

## Tech Stack

**Frontend:**
- React 18 + TypeScript + Vite
- React Router v6
- React-Leaflet + Leaflet
- Lucide React icons
- CSS Variables for theming

**Backend:**
- FastAPI + SQLAlchemy + SQLite
- JWT authentication (pbkdf2_sha256)
- RESTful API with auto-docs

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

**Access:** http://localhost:5173 (proxies to backend on :8000)

## Demo Credentials
- Email: `contractor@geotrace.local`
- Password: `password123`
- Role: Contractor / Field Recorder

## Project Structure
```
geotrace-gis/
├── backend/
│   ├── app/
│   │   ├── api/          # API routes (auth, projects, assets, segments, etc.)
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── core/         # Security, config
│   │   └── db/           # Database session
│   ├── requirements.txt
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── components/   # Layout, UI components
│   │   ├── pages/        # Dashboard, Projects, Map, CAD, Capture, Settings
│   │   ├── hooks/        # useAuth
│   │   ├── services/     # API client (axios)
│   │   └── types/        # TypeScript types
│   ├── package.json
│   └── .gitignore
├── .gitignore
└── README.md
```

## API Endpoints
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/{id}` - Get project
- `GET /api/v1/projects/{id}/assets` - List assets
- `POST /api/v1/projects/{id}/assets` - Create asset
- `GET /api/v1/assets/{id}/segments` - List segments
- `GET /api/v1/projects/{id}/map` - Map data

## License
MIT
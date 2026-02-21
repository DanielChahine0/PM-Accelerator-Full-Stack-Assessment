# Weather App — PM Accelerator Full-Stack Assessment

**Author:** Daniel Chahine
**Assessment:** AI Engineer Intern Technical Assessment (Full Stack — #1 + #2)

---

## About PM Accelerator

**Product Manager Accelerator** is a global community dedicated to helping aspiring and current product managers accelerate their careers. Through mentorship, resources, structured programs, and real-world project experience, PM Accelerator bridges the gap between ambition and opportunity in the product management field.

[PM Accelerator on LinkedIn](https://www.linkedin.com/school/pmaccelerator/)

---

## Features

### Frontend (React)
- Search by city, zip code, GPS coordinates, or landmark
- "Use My Location" button (Geolocation API)
- Real-time current weather with temperature, humidity, wind, pressure, visibility
- 5-day forecast with daily highs/lows, precipitation probability, wind
- Air quality index (AQI) with health level labels
- YouTube videos for the location (travel & weather)
- Interactive map embed (Google Maps or OpenStreetMap fallback)
- Save weather records with date ranges to history
- Responsive design — works on desktop, tablet, and mobile
- Graceful error handling with user-friendly messages

### Backend (FastAPI + PostgreSQL)
- Full CRUD for weather records with date range validation
- Geocoding via Nominatim (OSM) — supports cities, zips, GPS, landmarks
- Current weather + 5-day forecast via OpenWeatherMap
- Historical weather via Open-Meteo (free, no key needed)
- Air quality via Open-Meteo AQI API
- YouTube API integration for location videos
- Google Maps Embed API integration
- Data export: JSON, CSV, XML, PDF, Markdown
- Input validation (date ranges, location existence)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router, Axios, Lucide React |
| Backend | FastAPI, Uvicorn |
| Database | PostgreSQL |
| ORM | SQLAlchemy (sync) |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| Weather | OpenWeatherMap, Open-Meteo |
| Geocoding | Nominatim (OpenStreetMap) |
| Maps | Google Maps Embed / OpenStreetMap |
| Videos | YouTube Data API v3 |
| Air Quality | Open-Meteo AQI |
| PDF Export | ReportLab |

---

## Project Structure

```
PM-Accelerator-Full-Stack-Assessment/
├── backend/
│   ├── app/
│   │   ├── core/config.py        
│   │   ├── database.py           
│   │   ├── main.py               
│   │   ├── models/weather.py     
│   │   ├── schemas/weather.py    
│   │   ├── routers/
│   │   │   ├── weather.py        
│   │   │   ├── integrations.py   
│   │   │   └── export.py         
│   │   └── services/
│   │       ├── geocoding.py      
│   │       ├── weather_api.py    
│   │       ├── integrations.py   
│   │       └── export.py         
│   ├── alembic/                  
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── .env                      
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/           
    │   ├── pages/                
    │   ├── services/api.js       
    │   └── index.css             
    ├── .env
    ├── .env.example
    └── package.json
```

---

## Setup & Running

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL running locally (or a cloud instance)

---

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd PM-Accelerator-Full-Stack-Assessment
```

---

### 2. Backend setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/weather_db
OPENWEATHER_API_KEY=your_key_here      # https://openweathermap.org/api (free)
YOUTUBE_API_KEY=your_key_here          # optional
GOOGLE_MAPS_API_KEY=your_key_here      # optional, OSM used as fallback
```

#### Create the database

```bash
createdb weather_db
# OR: psql -U postgres -c "CREATE DATABASE weather_db;"
```

#### Run Alembic migrations

```bash
alembic upgrade head
```

#### Start the backend server

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

---

### 3. Frontend setup

```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

App: http://localhost:5173

---

## API Endpoints

### Live Weather
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/weather/current?location=...` | Current weather |
| GET | `/weather/forecast?location=...` | 5-day forecast |
| GET | `/weather/geocode?location=...` | Resolve location to coords |

### CRUD Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/weather/records` | Create record |
| GET | `/weather/records` | List all records |
| GET | `/weather/records/{id}` | Get single record |
| PATCH | `/weather/records/{id}` | Update record |
| DELETE | `/weather/records/{id}` | Delete record |

### Integrations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/integrations/youtube?location=...` | YouTube videos |
| GET | `/integrations/map?location=...` | Map embed URLs |
| GET | `/integrations/air-quality?location=...` | Air quality index |

### Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/export/records?format=json` | Export all records |
| GET | `/export/records?format=csv&record_ids=1,2,3` | Export specific records |

Supported formats: `json`, `csv`, `xml`, `pdf`, `markdown`

---

## API Keys Needed

| API | Free Tier | Where to Get |
|-----|-----------|--------------|
| OpenWeatherMap | Yes (required) | https://openweathermap.org/api |
| YouTube Data v3 | Yes (optional) | https://console.developers.google.com |
| Google Maps Embed | Yes (optional) | https://console.developers.google.com |
| Open-Meteo | Free, no key | https://open-meteo.com |
| Nominatim (OSM) | Free, no key | https://nominatim.org |

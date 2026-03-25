## Running with Docker

### Development (Vite + hot reload)

Start the full development stack:

docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

Services:
Frontend: http://localhost:5173  
Backend API: http://localhost:8000  
Postgres: http://localhost:5432  

Notes:
- Frontend runs with hot reload (Vite)
- API requests are proxied to the backend
- Database is accessible locally

---

### Production (built frontend served by backend)

Start the production stack:

docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build

Services:
App (Frontend + Backend): http://localhost:8000  
Postgres: internal container  

Notes:
- No Vite dev server
- Frontend is prebuilt and served by the backend
- API is available at /api/...

---

### First-time setup

On first run, enable database sync:

SYNC_DB: "true"

Then start the stack. Once tables are created, remove this setting.
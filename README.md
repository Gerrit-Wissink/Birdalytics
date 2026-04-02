## Running with Docker

### Development (Vite + hot reload)

Start the full development stack:

docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

Services:
Frontend: http://localhost:5173  
Backend API: http://localhost:8000  
Postgres: localhost:5432  

Notes:
- Frontend runs with hot reload (Vite)
- API requests are proxied to the backend
- Database is accessible locally
- Worker is not started by default

To include the ML worker:

docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile ml up --build

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
- Worker is included by default
- All traffic goes through port 8000

---

### First-time setup

On first run, enable database sync:

SYNC_DB: "true"

Then start the stack. Once tables are created, remove this setting.

---

### Notes on build time

- The first Docker build may take 10–20 minutes, especially due to ML dependencies
- Subsequent runs are much faster
- If images are already built, you can skip rebuilding:
docker compose up

## Restoring the database

Make sure you have a dump file located in the projext root (more info: https://docs.google.com/document/d/1_WJIo6suu6_xlqKz8dcwCui0GHJZWAkq/edit?usp=sharing&ouid=106291627670098283687&rtpof=true&sd=true)
After starting Docker, load the starter dataset with:

```bash
docker compose exec -T db pg_restore -U postgres -d birdalytics < backup.dump
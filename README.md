# OSRS Marketplace

A full-stack application for tracking Old School RuneScape item prices and finding optimal equipment based on efficiency calculations.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Git (optional, for version control)

### Setup
1. **Clone the repository** (or download the project)
2. **Copy environment file**: `cp .env.example .env`
3. **Edit .env file** and set your database password (required!)
4. **Start the application**: `docker-compose up -d`

**⚠️ Important:** The `.env` file is required as it contains your database password. Docker Compose will read these environment variables.

### Core Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild and restart (after code changes)
docker-compose down && docker-compose up -d --build

# View running containers
docker ps

# View logs
docker-compose logs
```

## 📁 Project Structure

```
TheGrandMarketplace/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── db/            # Database utilities
│   │   ├── scraping/      # Web scraping scripts
│   │   └── index.ts       # Main server file
│   └── Dockerfile
├── frontend/               # React/Vite application
│   ├── src/
│   │   ├── views/         # Main pages
│   │   ├── components/    # Reusable components
│   │   └── types/         # TypeScript definitions
│   └── Dockerfile
├── docker-compose.yml     # Container orchestration
└── README.md             # This file
```

## 🐳 Container Management

### Container Information
- **Frontend**: `osrs_frontend` - http://localhost:5173
- **Backend**: `osrs_backend` - http://localhost:3001
- **Database**: `osrs_db` - localhost:5432

### Working with Containers

#### Access Container Shells
```bash
# Backend container (Node.js)
docker exec -it osrs_backend bash

# Database container (PostgreSQL)
docker exec -it osrs_db bash

# Frontend container (Nginx)
docker exec -it osrs_frontend sh
```

#### Run Commands in Containers
```bash
# Backend development
docker exec -it osrs_backend npm run dev
docker exec -it osrs_backend npm run build
docker exec -it osrs_backend npm install <package>

# Database operations
docker exec -it osrs_db psql -U postgres -d osrs_market
docker exec -it osrs_db psql -U postgres -d osrs_market -c "SELECT * FROM items LIMIT 5;"

# View container logs
docker logs osrs_backend
docker logs osrs_frontend
docker logs osrs_db
```

## 🗄️ Database

### Connection Details
- **Host**: localhost
- **Port**: 5432
- **Database**: osrs_market
- **Username**: postgres
- **Password**: postgres

### Key Tables
- `items` - Static item data
- `item_prices` - Dynamic price data with timestamps
- `equipment_attributes` - Equipment stats and slot information

### Common Database Commands
```bash
# Connect to database
docker exec -it osrs_db psql -U postgres -d osrs_market

# List all tables
\dt

# View table structure
\d items
\d item_prices
\d equipment_attributes

# Sample queries
SELECT COUNT(*) FROM items;
SELECT * FROM item_prices WHERE current_price > 1000000 LIMIT 10;
```

## 🔧 Development Workflow

### Making Code Changes

1. **Edit files locally** using your preferred editor
2. **Rebuild containers** to apply changes:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

### Alternative: Live Development
```bash
# For backend live reload (if configured)
docker exec -it osrs_backend npm run dev

# For frontend development
cd frontend
npm run dev
```

## 📊 API Endpoints

### Items
- `GET /items` - All items
- `GET /items/search?name=<query>` - Search items by name
- `GET /items/prices` - All item prices

### Equipment
- `GET /optimal/equipments` - All equipment with efficiency calculations
- `GET /optimal/equipments/<attribute>` - Top 5 equipment per slot for specific attribute
- `GET /optimal/equipments/sample` - Sample equipment data

### Available Attributes
- `melee_strength`, `ranged_strength`, `magic_damage`
- `stab_acc`, `slash_acc`, `crush_acc`, `magic_acc`, `ranged_acc`
- `stab_def`, `slash_def`, `crush_def`, `magic_def`, `ranged_def`
- `prayer_bonus`

## 🛠️ Troubleshooting

### Common Issues

#### Containers won't start
```bash
# Check Docker Desktop is running
docker --version

# Check for port conflicts
docker ps -a

# Clean up and restart
docker-compose down
docker system prune -f
docker-compose up -d --build
```

#### Database connection issues
```bash
# Check database container
docker logs osrs_db

# Verify database exists
docker exec -it osrs_db psql -U postgres -c "\l"
```

#### Frontend not loading
```bash
# Check frontend logs
docker logs osrs_frontend

# Verify frontend is running
curl http://localhost:5173
```

#### Backend API errors
```bash
# Check backend logs
docker logs osrs_backend

# Test API directly
curl http://localhost:3001/items
```

### Reset Everything
```bash
# Nuclear option - removes all containers and data
docker-compose down -v
docker system prune -a -f
docker-compose up -d --build
```

## 🔄 Data Population

The application includes scripts to populate data:

```bash
# Run inside backend container
docker exec -it osrs_backend node dist/db/populateItems.js
docker exec -it osrs_backend node dist/db/populatePrices.js
docker exec -it osrs_backend node dist/scraping/scrapeEquipment.js
```

## 📝 Environment Variables

Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Then edit `.env` with your settings:
```env
PG_USER=postgres
PG_PASSWORD=your_database_password_here
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=osrs_market
BACKEND_PORT=3001
FRONTEND_PORT=5173
API_URL=http://localhost:3001
```

**⚠️ Never commit the `.env` file to version control!**

## 🤝 Contributing

1. Make changes to source code
2. Test locally with `docker-compose up -d --build`
3. Commit changes
4. Deploy with container rebuild

---

**Need help?** Check container logs with `docker logs <container_name>` or access container shells with `docker exec -it <container_name> bash`

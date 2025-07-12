# CAMS Application Startup Sequence

This document explains the proper startup sequence for the CAMS application and the dependencies between services.

## 🏗️ Architecture Overview

CAMS is a multi-container application with the following services:
- **Database** (SQL Server 2022) - Data persistence layer
- **Backend** (.NET 8 Web API) - Business logic and API endpoints  
- **Frontend** (React + Vite) - User interface

## 📋 Startup Sequence

The services must start in a specific order to ensure proper initialization:

### 1️⃣ Database (SQL Server)
- **Starts first** - No dependencies
- **Health check**: SQL Server accepts connections and can execute queries
- **Time to ready**: ~30-45 seconds (first start), ~15-20 seconds (subsequent starts)
- **Health check command**: `sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -Q "SELECT 1"`

### 2️⃣ Backend (.NET API) 
- **Waits for**: Database health check to pass
- **Health check**: HTTP GET to `/health` endpoint returns 200 OK
- **Time to ready**: ~20-30 seconds after database is ready
- **Health check command**: `curl -f http://localhost:8080/health`

### 3️⃣ Frontend (React)
- **Waits for**: Backend health check to pass  
- **Health check**: HTTP GET to root returns 200 OK
- **Time to ready**: ~10-15 seconds after backend is ready
- **Health check command**: `curl -f http://localhost:3000` (dev) or `curl -f http://localhost/health` (prod)

## 🚀 Starting the Application

### Option 1: Automatic Startup (Recommended)
Use the provided startup script that handles the sequence automatically:

```bash
# Development environment
./startup-sequence.sh

# Production environment  
./startup-sequence.sh prod
```

### Option 2: Manual Docker Compose
Docker Compose will automatically handle the dependencies:

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Step-by-Step Manual Control
If you need fine-grained control:

```bash
# 1. Start database and wait for health check
docker-compose up -d db
docker-compose ps db  # Wait for "healthy" status

# 2. Start backend and wait for health check  
docker-compose up -d backend
docker-compose ps backend  # Wait for "healthy" status

# 3. Start frontend
docker-compose up -d frontend
docker-compose ps frontend  # Wait for "healthy" status
```

## 🔧 Configuration Details

### Health Check Configuration

#### Database
```yaml
healthcheck:
  test: ["CMD-SHELL", "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P \"$SA_PASSWORD\" -Q \"SELECT 1\" -C -l 30"]
  interval: 15s
  timeout: 10s
  retries: 10
  start_period: 45s
```

#### Backend
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 40s
```

#### Frontend
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000"]  # Dev
  # test: ["CMD", "curl", "-f", "http://localhost/health"]  # Prod
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 40s
```

### Dependency Configuration

#### Frontend depends on Backend
```yaml
frontend:
  depends_on:
    backend:
      condition: service_healthy
```

#### Backend depends on Database
```yaml
backend:
  depends_on:
    db:
      condition: service_healthy
```

## 📊 Monitoring Startup

### Check Service Status
```bash
# View all services status
docker-compose ps

# Check specific service health
docker-compose ps db
docker-compose ps backend  
docker-compose ps frontend
```

### View Startup Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f db
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Health Check Details
```bash
# Inspect health check status
docker inspect <container_name> | grep -A 20 "Health"
```

## ⚡ Performance Notes

### Startup Times (Typical)
- **Database**: 30-45s (first time), 15-20s (subsequent)
- **Backend**: 20-30s (after database ready)
- **Frontend**: 10-15s (after backend ready)
- **Total**: ~60-90s end-to-end

### Optimization Tips
1. **Use persistent volumes** - Database startup is much faster on subsequent runs
2. **Pre-built images** - Build images ahead of time to reduce startup time
3. **Resource allocation** - Ensure adequate CPU/memory for containers
4. **Network optimization** - Use Docker networks for inter-service communication

## 🛠️ Troubleshooting

### Database Won't Start
- Check SA_PASSWORD environment variable
- Verify disk space for database volume
- Check Docker logs: `docker-compose logs db`

### Backend Can't Connect to Database  
- Verify database health check is passing
- Check DB_HOST environment variable (should be `db`)
- Verify connection string configuration
- Check Docker logs: `docker-compose logs backend`

### Frontend Can't Reach Backend
- Verify backend health check is passing  
- Check VITE_PROXY_TARGET environment variable
- Verify API endpoint configuration
- Check Docker logs: `docker-compose logs frontend`

### Health Checks Failing
- Increase timeout values if services are slow to start
- Check service-specific logs for startup errors
- Verify health check commands are correct for your environment

## 🔄 Restart Strategies

### Graceful Restart
```bash
docker-compose down
./startup-sequence.sh
```

### Rolling Restart (Production)
```bash
# Restart services one at a time to minimize downtime
docker-compose restart frontend
docker-compose restart backend  
docker-compose restart db  # Only if necessary
```

### Force Rebuild
```bash
docker-compose down -v  # Remove volumes (caution: data loss)
docker-compose build --no-cache
./startup-sequence.sh
```

## 📋 Environment Variables

Key environment variables that affect startup:

- `DB_PASSWORD` - Database SA password
- `JWT_SECRET_KEY` - Backend JWT configuration
- `COMPOSE_PROJECT_NAME` - Project naming prefix
- `NODE_ENV` - Frontend environment mode
- `ASPNETCORE_ENVIRONMENT` - Backend environment mode

## 🔐 Security Considerations

1. **Environment Variables**: Store sensitive values in `.env` file (not committed)
2. **Health Check Endpoints**: Ensure they don't expose sensitive information
3. **Network Isolation**: Services communicate via Docker network
4. **Resource Limits**: Set appropriate CPU/memory limits in production
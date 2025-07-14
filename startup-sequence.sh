#!/bin/bash

# CAMS Application Startup Script
# This script demonstrates the proper startup sequence for the CAMS application
# 
# Startup Order:
# 1. Database (SQL Server) - Must be healthy before proceeding
# 2. Backend (.NET API) - Waits for database health check, must be healthy before proceeding  
# 3. Frontend (React) - Waits for backend health check

set -e

echo "🚀 Starting CAMS Application with proper dependency sequence..."
echo ""

# Get environment (default to development)
ENVIRONMENT=${1:-dev}

if [ "$ENVIRONMENT" = "prod" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    echo "📦 Using production configuration"
else
    COMPOSE_FILE="docker-compose.yml" 
    echo "🔧 Using development configuration"
fi

echo ""
echo "📋 Startup Sequence:"
echo "   1️⃣  Database (SQL Server 2022)"
echo "   2️⃣  Backend (.NET 8 API)"  
echo "   3️⃣  Frontend (React + Vite)"
echo ""

# Function to check if a service is healthy
check_service_health() {
    local service_name=$1
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $service_name to be healthy..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f $COMPOSE_FILE ps $service_name | grep -q "healthy"; then
            echo "✅ $service_name is healthy!"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to become healthy after $max_attempts attempts"
    return 1
}

# Start the database first
echo "1️⃣  Starting Database..."
docker-compose -f $COMPOSE_FILE up -d db

# Wait for database to be healthy
if ! check_service_health "db"; then
    echo "💥 Database startup failed. Exiting."
    exit 1
fi

echo ""
echo "2️⃣  Starting Backend (waits for database health check)..."
docker-compose -f $COMPOSE_FILE up -d backend

# Wait for backend to be healthy  
if ! check_service_health "backend"; then
    echo "💥 Backend startup failed. Exiting."
    exit 1
fi

echo ""
echo "3️⃣  Starting Frontend (waits for backend health check)..."
docker-compose -f $COMPOSE_FILE up -d frontend

# Wait for frontend to be healthy
if ! check_service_health "frontend"; then
    echo "💥 Frontend startup failed. Exiting."
    exit 1
fi

echo ""
echo "🎉 All services are healthy and running!"
echo ""
echo "🌐 Application URLs:"
if [ "$ENVIRONMENT" = "prod" ]; then
    echo "   Frontend: http://localhost"
    echo "   Backend API: http://localhost:8080"
else
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8080"
fi
echo "   Database: localhost:1433"
echo ""
echo "📊 View running services:"
echo "   docker-compose -f $COMPOSE_FILE ps"
echo ""
echo "📋 View logs:"
echo "   docker-compose -f $COMPOSE_FILE logs -f [service_name]"
echo ""
echo "🛑 Stop all services:"
echo "   docker-compose -f $COMPOSE_FILE down"
#!/bin/bash

echo "🐘 PostgreSQL Connection Test Script"
echo "===================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if PostgreSQL container is running
if docker ps | grep -q "cams-database"; then
    echo "✅ PostgreSQL container is running"
    
    # Test connection from host
    echo -e "\n📋 Testing connection from host machine..."
    docker exec cams-database psql -U postgres -d CamsDb -c "SELECT 'Connection successful!' as status;" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Direct connection test passed"
    else
        echo "❌ Direct connection test failed"
    fi
    
    # Get container IP
    DB_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' cams-database)
    echo -e "\n📊 PostgreSQL Container Details:"
    echo "   Container Name: cams-database"
    echo "   Internal IP: $DB_IP"
    echo "   Exposed Port: 5432"
    echo "   Database: CamsDb"
    echo "   Username: postgres"
    
    echo -e "\n🔌 Connection Strings:"
    echo "   From Host: Host=localhost;Port=5432;Database=CamsDb;Username=postgres;Password=YourStrong!Passw0rd"
    echo "   From Docker: Host=db;Port=5432;Database=CamsDb;Username=postgres;Password=YourStrong!Passw0rd"
    echo "   Direct IP: Host=$DB_IP;Port=5432;Database=CamsDb;Username=postgres;Password=YourStrong!Passw0rd"
else
    echo "❌ PostgreSQL container is not running"
    echo ""
    echo "To start PostgreSQL:"
    echo "   docker-compose up -d"
    echo ""
    echo "To check all containers:"
    echo "   docker-compose ps"
fi

echo -e "\n💡 Testing via CAMS API:"
echo "1. First ensure the backend is running:"
echo "   docker-compose up -d"
echo ""
echo "2. Get auth token:"
echo "   curl -X POST http://localhost:8080/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"Username\":\"admin\",\"Password\":\"admin123\"}'"
echo ""
echo "3. Test connection (use 'db' as server when testing from Docker):"
echo "   curl -X POST http://localhost:8080/database-connections/test \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{"
echo "       \"ConnectionDetails\": {"
echo "         \"Type\": 3,"
echo "         \"Server\": \"db\","
echo "         \"Port\": 5432,"
echo "         \"Database\": \"CamsDb\","
echo "         \"Username\": \"postgres\","
echo "         \"Password\": \"YourStrong!Passw0rd\""
echo "       }"
echo "     }'"
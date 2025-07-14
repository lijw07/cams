#!/bin/bash

# CAMS Quick Deploy Script
# This script helps you quickly deploy CAMS locally or to a server

echo "🚀 CAMS Quick Deploy"
echo "==================="
echo ""
echo "Choose deployment option:"
echo "1) Local deployment (Docker Compose)"
echo "2) Deploy to VPS/Server"
echo "3) Deploy frontend only (GitHub Pages)"
echo "4) Build and test locally"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
  1)
    echo "📦 Starting local deployment..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        echo "Visit: https://www.docker.com/get-started"
        exit 1
    fi
    
    # Copy environment files if they don't exist
    if [ ! -f "Backend/.env" ]; then
        echo "📝 Creating Backend .env file..."
        cp Backend/.env.example Backend/.env
        echo "⚠️  Please edit Backend/.env with your configuration"
    fi
    
    if [ ! -f "frontend/.env" ]; then
        echo "📝 Creating frontend .env file..."
        echo "VITE_APP_API_URL=http://localhost:5162" > frontend/.env
        echo "VITE_APP_ENV=development" >> frontend/.env
    fi
    
    # Start services
    echo "🔨 Building and starting services..."
    docker-compose -f docker-compose.prod.yml up --build -d
    
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "Access your application at:"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:5162"
    echo "📚 API Documentation: http://localhost:5162/swagger"
    echo ""
    echo "Default login credentials:"
    echo "Username: admin"
    echo "Password: Admin123!"
    echo ""
    echo "To stop: docker-compose down"
    echo "To view logs: docker-compose logs -f"
    ;;
    
  2)
    echo "🖥️  Server deployment"
    read -p "Enter server IP/hostname: " SERVER
    read -p "Enter SSH username: " SSH_USER
    
    echo "📤 Preparing deployment package..."
    
    # Create deployment directory
    ssh $SSH_USER@$SERVER "mkdir -p ~/cams"
    
    # Copy necessary files
    scp docker-compose.prod.yml $SSH_USER@$SERVER:~/cams/
    scp -r Backend/Dockerfile $SSH_USER@$SERVER:~/cams/Backend/
    scp -r frontend/Dockerfile $SSH_USER@$SERVER:~/cams/frontend/
    
    # Copy environment files
    if [ -f "Backend/.env" ]; then
        scp Backend/.env $SSH_USER@$SERVER:~/cams/Backend/
    else
        scp Backend/.env.example $SSH_USER@$SERVER:~/cams/Backend/.env
    fi
    
    # Deploy on server
    echo "🚀 Deploying on server..."
    ssh $SSH_USER@$SERVER << 'ENDSSH'
        cd ~/cams
        
        # Create frontend .env if it doesn't exist
        if [ ! -f "frontend/.env" ]; then
            echo "VITE_APP_API_URL=http://$(hostname -I | awk '{print $1}'):5162" > frontend/.env
            echo "VITE_APP_ENV=production" >> frontend/.env
        fi
        
        # Pull and start containers
        docker-compose -f docker-compose.prod.yml pull
        docker-compose -f docker-compose.prod.yml up -d
        
        # Show status
        docker-compose ps
ENDSSH
    
    echo ""
    echo "✅ Server deployment complete!"
    echo ""
    echo "Access your application at:"
    echo "🌐 Frontend: http://$SERVER:3000"
    echo "🔧 Backend API: http://$SERVER:5162"
    echo "📚 API Documentation: http://$SERVER:5162/swagger"
    ;;
    
  3)
    echo "📄 Deploying frontend to GitHub Pages..."
    
    # Check if gh-pages is installed
    if ! command -v gh-pages &> /dev/null; then
        echo "📦 Installing gh-pages..."
        npm install -g gh-pages
    fi
    
    # Build frontend
    echo "🔨 Building frontend..."
    cd frontend
    npm install
    VITE_APP_API_URL=https://your-backend-url.com npm run build
    
    # Deploy to GitHub Pages
    echo "🚀 Deploying to GitHub Pages..."
    gh-pages -d dist
    
    echo ""
    echo "✅ Frontend deployed!"
    echo "🌐 Your site will be available at: https://[your-username].github.io/cams"
    echo ""
    echo "⚠️  Note: You still need to deploy the backend separately for full functionality"
    ;;
    
  4)
    echo "🧪 Building and testing locally..."
    
    # Backend
    echo "🔨 Building backend..."
    dotnet build
    
    echo "🧪 Running backend tests..."
    dotnet test
    
    # Frontend
    echo "🔨 Building frontend..."
    cd frontend
    npm install
    npm run build
    
    echo "🧪 Running frontend checks..."
    npm run lint
    npm run type-check
    
    echo ""
    echo "✅ Build and test complete!"
    echo ""
    echo "To run locally without Docker:"
    echo "1. Start SQL Server"
    echo "2. Run: dotnet run (in Backend directory)"
    echo "3. Run: npm run dev (in frontend directory)"
    ;;
    
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac
# CAMS Deployment Guide

This guide walks you through publishing your CAMS application to production.

## Quick Start - GitHub Pages (Frontend Only)

For a quick demo deployment of just the frontend:

```bash
# 1. Build the frontend
cd frontend
npm install
npm run build

# 2. Deploy to GitHub Pages
npm install -g gh-pages
gh-pages -d dist
```

Your site will be available at: `https://[your-username].github.io/cams`

## Full Stack Deployment Options

### Option 1: Deploy to a VPS (Recommended for Getting Started)

#### Requirements
- A VPS (DigitalOcean, Linode, AWS EC2, etc.)
- Docker and Docker Compose installed
- Domain name (optional)

#### Steps

1. **Prepare your VPS**
   ```bash
   # SSH into your server
   ssh user@your-server-ip
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Clone your repository**
   ```bash
   git clone https://github.com/[your-username]/cams.git
   cd cams
   ```

3. **Configure environment**
   ```bash
   # Copy and edit the backend environment file
   cp Backend/.env.example Backend/.env
   nano Backend/.env
   
   # Update these critical values:
   # - DB_CONNECTION_STRING (use a strong password)
   # - JWT_KEY (generate a secure 256-bit key)
   # - FRONTEND_URL (your domain or server IP)
   
   # Copy and edit the frontend environment file
   cp frontend/.env.example frontend/.env
   nano frontend/.env
   
   # Update:
   # - VITE_APP_API_URL=http://your-server-ip:5162
   ```

4. **Deploy with Docker Compose**
   ```bash
   # Use the production compose file
   docker-compose -f docker-compose.prod.yml up -d
   
   # Check if services are running
   docker ps
   
   # View logs
   docker-compose logs -f
   ```

5. **Access your application**
   - Frontend: `http://your-server-ip:3000`
   - Backend API: `http://your-server-ip:5162`
   - API Docs: `http://your-server-ip:5162/swagger`

### Option 2: Deploy to Cloud Platforms

#### Deploy to Heroku

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   ```

2. **Create Heroku apps**
   ```bash
   # Login to Heroku
   heroku login
   
   # Create backend app
   heroku create cams-backend-[yourname]
   
   # Create frontend app
   heroku create cams-frontend-[yourname]
   ```

3. **Deploy Backend**
   ```bash
   # Add Heroku Postgres
   heroku addons:create heroku-postgresql:mini -a cams-backend-[yourname]
   
   # Set environment variables
   heroku config:set JWT_KEY="your-secure-key" -a cams-backend-[yourname]
   heroku config:set FRONTEND_URL="https://cams-frontend-[yourname].herokuapp.com" -a cams-backend-[yourname]
   
   # Deploy using container
   heroku container:push web -a cams-backend-[yourname] --context-path . -f Backend/Dockerfile
   heroku container:release web -a cams-backend-[yourname]
   ```

4. **Deploy Frontend**
   ```bash
   # Create static buildpack
   cd frontend
   echo '{ "root": "dist" }' > static.json
   
   # Set buildpacks
   heroku buildpacks:add heroku/nodejs -a cams-frontend-[yourname]
   heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static -a cams-frontend-[yourname]
   
   # Set API URL
   heroku config:set VITE_APP_API_URL="https://cams-backend-[yourname].herokuapp.com" -a cams-frontend-[yourname]
   
   # Deploy
   git push heroku main
   ```

#### Deploy to Azure

1. **Using Azure Container Instances**
   ```bash
   # Login to Azure
   az login
   
   # Create resource group
   az group create --name cams-rg --location eastus
   
   # Create Azure SQL Database
   az sql server create --name cams-sql-[yourname] --resource-group cams-rg --admin-user camsadmin --admin-password YourStrongPassword123!
   az sql db create --resource-group cams-rg --server cams-sql-[yourname] --name camsdb --service-objective S0
   
   # Deploy containers
   az container create --resource-group cams-rg --name cams-backend --image ghcr.io/[your-username]/cams/backend:latest --cpu 1 --memory 1 --ports 5162
   ```

2. **Using Azure App Service**
   ```bash
   # Create App Service Plan
   az appservice plan create --name cams-plan --resource-group cams-rg --sku B1 --is-linux
   
   # Create Web Apps
   az webapp create --resource-group cams-rg --plan cams-plan --name cams-backend-[yourname] --deployment-container-image-name ghcr.io/[your-username]/cams/backend:latest
   az webapp create --resource-group cams-rg --plan cams-plan --name cams-frontend-[yourname] --deployment-container-image-name ghcr.io/[your-username]/cams/frontend:latest
   ```

#### Deploy to AWS

1. **Using AWS ECS**
   ```bash
   # Install AWS CLI and configure
   aws configure
   
   # Create ECR repositories
   aws ecr create-repository --repository-name cams-backend
   aws ecr create-repository --repository-name cams-frontend
   
   # Push images to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [account-id].dkr.ecr.us-east-1.amazonaws.com
   
   docker tag cams-backend:latest [account-id].dkr.ecr.us-east-1.amazonaws.com/cams-backend:latest
   docker push [account-id].dkr.ecr.us-east-1.amazonaws.com/cams-backend:latest
   ```

2. **Deploy with CloudFormation**
   - Use the AWS Console to create an ECS cluster
   - Create task definitions for backend and frontend
   - Create services with load balancers

### Option 3: Deploy Using GitHub Actions (Automated)

1. **Fork and Setup Repository**
   ```bash
   # Fork the repository on GitHub
   # Clone your fork
   git clone https://github.com/[your-username]/cams.git
   cd cams
   ```

2. **Configure GitHub Secrets**
   Go to Settings > Secrets and add:
   - `DEPLOY_HOST`: Your server IP
   - `DEPLOY_USER`: SSH username
   - `DEPLOY_KEY`: SSH private key
   - Any cloud provider credentials

3. **Configure Deployment Variables**
   Go to Settings > Environments > production and add:
   - `API_URL`: Your backend URL
   - `FRONTEND_DOMAIN`: Your frontend domain
   - `DEPLOY_METHOD`: compose/kubernetes/swarm
   - `FRONTEND_DEPLOY_METHOD`: s3/netlify/pages

4. **Trigger Deployment**
   ```bash
   # Create and push a tag to trigger release
   git tag v1.0.0
   git push origin v1.0.0
   
   # Or manually trigger
   gh workflow run deploy.yml -f environment=production
   ```

## Free Hosting Options

### Backend
1. **Railway.app**
   - Free tier available
   - Automatic deployments from GitHub
   - Built-in PostgreSQL

2. **Render.com**
   - Free tier with limitations
   - Automatic SSL
   - Built-in PostgreSQL

3. **Fly.io**
   - Generous free tier
   - Global deployment
   - Built-in PostgreSQL

### Frontend
1. **Vercel**
   ```bash
   npm install -g vercel
   cd frontend
   vercel
   ```

2. **Netlify**
   ```bash
   npm install -g netlify-cli
   cd frontend
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **GitHub Pages**
   - Already configured in your CI/CD
   - Free with GitHub account

### Database
1. **Supabase**
   - Free PostgreSQL database
   - Good for development

2. **PlanetScale**
   - Free MySQL-compatible database
   - Serverless scaling

## Quick Deploy Script

Create a file `deploy.sh`:

```bash
#!/bin/bash

# Configuration
SERVER_IP="your-server-ip"
SSH_USER="your-ssh-user"
DOMAIN="your-domain.com"  # optional

echo "🚀 Deploying CAMS to $SERVER_IP"

# Build and push Docker images
echo "📦 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

# If using Docker Hub or GitHub Container Registry
# docker-compose -f docker-compose.prod.yml push

# Copy files to server
echo "📤 Copying files to server..."
scp docker-compose.prod.yml $SSH_USER@$SERVER_IP:~/cams/
scp Backend/.env $SSH_USER@$SERVER_IP:~/cams/Backend/
scp frontend/.env $SSH_USER@$SERVER_IP:~/cams/frontend/

# Deploy on server
echo "🔄 Starting services on server..."
ssh $SSH_USER@$SERVER_IP << 'EOF'
  cd ~/cams
  docker-compose -f docker-compose.prod.yml pull
  docker-compose -f docker-compose.prod.yml up -d
  docker-compose ps
EOF

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://$SERVER_IP:3000"
echo "🔧 Backend: http://$SERVER_IP:5162"
echo "📚 API Docs: http://$SERVER_IP:5162/swagger"
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

## SSL/HTTPS Setup (Recommended)

### Using Nginx and Let's Encrypt

1. **Install Nginx**
   ```bash
   sudo apt update
   sudo apt install nginx certbot python3-certbot-nginx
   ```

2. **Configure Nginx**
   ```nginx
   # /etc/nginx/sites-available/cams
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location /api {
           proxy_pass http://localhost:5162;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **Enable HTTPS**
   ```bash
   sudo ln -s /etc/nginx/sites-available/cams /etc/nginx/sites-enabled/
   sudo certbot --nginx -d your-domain.com
   sudo systemctl restart nginx
   ```

## Monitoring Your Deployment

1. **Check Docker containers**
   ```bash
   docker ps
   docker-compose logs -f
   ```

2. **Monitor resources**
   ```bash
   docker stats
   htop
   ```

3. **Check application health**
   ```bash
   curl http://localhost:5162/health
   curl http://localhost:3000
   ```

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check connection string in .env
   - Ensure database container is running
   - Check firewall rules

2. **Frontend can't reach backend**
   - Verify VITE_APP_API_URL is correct
   - Check CORS settings
   - Ensure backend is accessible

3. **Container won't start**
   ```bash
   docker-compose logs [service-name]
   docker-compose down
   docker-compose up -d
   ```

4. **Permission issues**
   ```bash
   sudo chown -R $USER:$USER .
   chmod -R 755 .
   ```

## Next Steps

1. **Set up monitoring**
   - Configure application monitoring (e.g., Sentry)
   - Set up uptime monitoring (e.g., UptimeRobot)

2. **Configure backups**
   - Automated database backups
   - Application data backups

3. **Scale your application**
   - Add load balancing
   - Implement caching (Redis)
   - Use CDN for static assets

4. **Security hardening**
   - Configure firewall rules
   - Set up fail2ban
   - Regular security updates

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Review the [troubleshooting guide](#troubleshooting)
3. Open an issue on GitHub
4. Check the documentation in README.md

Good luck with your deployment! 🚀
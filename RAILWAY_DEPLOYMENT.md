# CAMS Railway Deployment Guide

## Why Railway?
- **5-minute deployment** vs hours of AWS setup
- **$5-20/month** vs $75-150/month on AWS  
- **Zero DevOps** - automatic builds, SSL, domains
- **Perfect for MVP** and getting to market quickly

## Prerequisites
1. GitHub account with your CAMS repository
2. Railway account (free signup at railway.app)
3. Credit card for paid tier (after free tier)

## Deployment Steps

### 1. Prepare Your Repository

#### Update Backend for PostgreSQL
Railway uses PostgreSQL instead of SQL Server. Update your connection string:

```csharp
// In appsettings.json or environment variable
"ConnectionStrings": {
  "DefaultConnection": "${{ DATABASE_URL }}" // Railway provides this automatically
}
```

#### Update Frontend Environment
```bash
# In frontend/.env
VITE_APP_API_URL=https://your-backend.railway.app
```

### 2. Deploy Backend to Railway

1. **Visit Railway.app** and sign up with GitHub
2. **Create New Project** → "Deploy from GitHub repo"
3. **Select Repository** → Choose your CAMS repo
4. **Configure Backend Service**:
   - **Root Directory**: `/Backend`
   - **Build Command**: `dotnet build`
   - **Start Command**: `dotnet run --urls=http://0.0.0.0:$PORT`

5. **Add Database**:
   - Click "Add Service" → "Database" → "PostgreSQL"
   - Railway automatically creates `DATABASE_URL` environment variable

6. **Set Environment Variables**:
   ```
   ASPNETCORE_ENVIRONMENT=Production
   JWT_KEY=your-secure-256-bit-key
   FRONTEND_URL=https://your-frontend.railway.app
   ```

7. **Deploy**: Railway automatically builds and deploys

### 3. Deploy Frontend to Railway

1. **Add New Service** → "Deploy from GitHub repo"
2. **Configure Frontend Service**:
   - **Root Directory**: `/frontend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run preview`

3. **Set Environment Variables**:
   ```
   VITE_APP_API_URL=https://your-backend.railway.app
   VITE_APP_ENV=production
   ```

4. **Deploy**: Automatic build and deployment

### 4. Database Migration

Since Railway uses PostgreSQL instead of SQL Server:

#### Option A: Start Fresh (Recommended for MVP)
- Railway PostgreSQL will be empty
- Your Entity Framework migrations will create the schema
- Perfect for new production deployment

#### Option B: Migrate Existing Data
```bash
# Export from SQL Server
sqlcmd -S localhost -d CamsDatabase -E -Q "SELECT * FROM Users" -o users.csv

# Import to PostgreSQL (use pgAdmin or similar tool)
```

## Railway Pricing

### Free Tier (Perfect for Testing)
- 512MB RAM
- 1GB Storage
- $0/month
- Great for development and initial testing

### Hobby Plan ($5/month per service)
- 8GB RAM
- 100GB Storage  
- Custom domains
- Perfect for small businesses

### Pro Plan ($20/month per service)
- 32GB RAM
- 100GB Storage
- Priority support
- Advanced metrics

**Total Cost for CAMS**: $10-40/month (backend + frontend + database)

## Advantages Over AWS

### 1. Time to Market
- **Railway**: 5 minutes to deploy
- **AWS**: 2+ hours setup + learning curve

### 2. Maintenance
- **Railway**: Zero maintenance, automatic updates
- **AWS**: Requires DevOps knowledge, security updates

### 3. Cost Predictability
- **Railway**: Fixed monthly pricing
- **AWS**: Variable costs, easy to overspend

### 4. Developer Experience
- **Railway**: Git push = live deployment
- **AWS**: Complex CI/CD setup required

## When to Switch to AWS

Consider AWS migration when you reach:
- **10,000+ active users**
- **Need for multiple regions**
- **Complex compliance requirements**
- **Custom infrastructure needs**
- **Advanced scaling requirements**

## Quick Migration Script

Create `deploy-railway.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying CAMS to Railway"

# Update frontend environment for Railway
cd frontend
cp .env.example .env
echo "VITE_APP_API_URL=https://cams-backend.railway.app" >> .env

# Update backend for PostgreSQL
cd ../Backend
# Add PostgreSQL connection string handling

echo "✅ Ready for Railway deployment!"
echo "1. Push to GitHub"
echo "2. Connect Railway to your repo"
echo "3. Configure services as described above"
```

## Monitoring & Logs

Railway provides built-in:
- **Application Logs**: Real-time log streaming
- **Metrics**: CPU, memory, network usage
- **Uptime Monitoring**: Automatic health checks
- **Custom Domains**: Easy SSL setup

## Backup Strategy

1. **Database Backups**:
   - Railway provides automatic daily backups
   - Manual backup: `pg_dump $DATABASE_URL > backup.sql`

2. **Application Backups**:
   - Code is backed up in GitHub
   - Environment variables backed up manually

## Scaling on Railway

### Horizontal Scaling
- Add more instances via Railway dashboard
- Built-in load balancing

### Vertical Scaling  
- Upgrade to higher memory/CPU plans
- No code changes required

## Security Features

- **Automatic HTTPS**: SSL certificates included
- **Private Networking**: Services communicate privately
- **Environment Variables**: Secure secret management
- **GitHub Integration**: Secure deployments from private repos

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check build logs in Railway dashboard
   # Ensure package.json scripts are correct
   ```

2. **Database Connection**:
   ```bash
   # Verify DATABASE_URL is set
   # Check PostgreSQL connection string format
   ```

3. **CORS Issues**:
   ```csharp
   // Update CORS policy for Railway domains
   services.AddCors(options =>
   {
       options.AddPolicy("Production", builder =>
       {
           builder.WithOrigins("https://your-frontend.railway.app")
                  .AllowAnyMethod()
                  .AllowAnyHeader();
       });
   });
   ```

## Next Steps After Railway Deployment

1. **Custom Domain**: Point your domain to Railway app
2. **Analytics**: Add Google Analytics or similar
3. **Error Tracking**: Integrate Sentry or similar
4. **Uptime Monitoring**: Use UptimeRobot or similar
5. **Payment Integration**: Implement Stripe as per PAYMENT_SYSTEM_GUIDE.md

## Migration Path to AWS

When you outgrow Railway:
1. Use the existing AWS_DEPLOYMENT_README.md
2. Export database from Railway PostgreSQL
3. Import to AWS RDS
4. Update DNS to point to AWS
5. Zero downtime migration possible

Railway is perfect for CAMS as an MVP platform - get to market fast, validate the business, then scale to AWS when needed.
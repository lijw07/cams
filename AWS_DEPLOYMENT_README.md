# CAMS AWS Production Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [AWS Infrastructure Setup](#aws-infrastructure-setup)
4. [Database Setup](#database-setup)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Security Configuration](#security-configuration)
8. [Monitoring & Logging](#monitoring--logging)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Domain & SSL Setup](#domain--ssl-setup)
11. [Backup & Recovery](#backup--recovery)
12. [Cost Optimization](#cost-optimization)
13. [Scaling Considerations](#scaling-considerations)
14. [Troubleshooting](#troubleshooting)

## Overview

This guide provides comprehensive instructions for deploying the CAMS (Centralized Application Management System) to AWS for production use. The deployment includes:

- **Frontend**: React application hosted on S3 + CloudFront
- **Backend**: .NET 8 API running on EC2 with Auto Scaling
- **Database**: Amazon RDS SQL Server
- **Load Balancer**: Application Load Balancer (ALB)
- **Security**: VPC, Security Groups, IAM roles
- **Monitoring**: CloudWatch, AWS X-Ray
- **CI/CD**: GitHub Actions with AWS CodeDeploy

### Architecture Overview
```
Internet Gateway
    ↓
Application Load Balancer (ALB)
    ↓
Auto Scaling Group (EC2 instances)
    ↓
Amazon RDS SQL Server
    ↓
CloudWatch Monitoring
```

**Estimated Monthly Cost**: $75-150 (depending on traffic and instance sizes)

## Prerequisites

### Required Tools
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install Terraform (Infrastructure as Code)
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Install Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose -y

# Install .NET 8 SDK (for local testing)
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install -y dotnet-sdk-8.0
```

### AWS Account Setup
1. **Create AWS Account**: Sign up at aws.amazon.com
2. **Configure Billing Alerts**: Set up billing alarms for cost control
3. **Create IAM User**: Don't use root account for deployment
4. **Configure AWS CLI**:
   ```bash
   aws configure
   # Enter your Access Key ID, Secret Access Key, Default region (us-east-1), Default output format (json)
   ```

### Domain Prerequisites
- **Domain Name**: Purchase a domain (AWS Route 53 or external registrar)
- **Email**: Valid email for SSL certificate validation

## AWS Infrastructure Setup

### 1. Create Terraform Configuration

Create `infrastructure/main.tf`:

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

# VPC Configuration
resource "aws_vpc" "cams_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "cams-vpc-${var.environment}"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "cams_igw" {
  vpc_id = aws_vpc.cams_vpc.id

  tags = {
    Name        = "cams-igw-${var.environment}"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.cams_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name        = "cams-public-subnet-1-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.cams_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name        = "cams-public-subnet-2-${var.environment}"
    Environment = var.environment
  }
}

# Private Subnets for Database
resource "aws_subnet" "private_subnet_1" {
  vpc_id            = aws_vpc.cams_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name        = "cams-private-subnet-1-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.cams_vpc.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name        = "cams-private-subnet-2-${var.environment}"
    Environment = var.environment
  }
}

# Route Table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.cams_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.cams_igw.id
  }

  tags = {
    Name        = "cams-public-rt-${var.environment}"
    Environment = var.environment
  }
}

# Route Table Associations
resource "aws_route_table_association" "public_rta_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_rta_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

# Security Groups
resource "aws_security_group" "alb_sg" {
  name_prefix = "cams-alb-sg-"
  vpc_id      = aws_vpc.cams_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "cams-alb-sg-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_security_group" "ec2_sg" {
  name_prefix = "cams-ec2-sg-"
  vpc_id      = aws_vpc.cams_vpc.id

  ingress {
    from_port       = 5162
    to_port         = 5162
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Restrict this to your IP in production
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "cams-ec2-sg-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_security_group" "rds_sg" {
  name_prefix = "cams-rds-sg-"
  vpc_id      = aws_vpc.cams_vpc.id

  ingress {
    from_port       = 1433
    to_port         = 1433
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
  }

  tags = {
    Name        = "cams-rds-sg-${var.environment}"
    Environment = var.environment
  }
}

# Application Load Balancer
resource "aws_lb" "cams_alb" {
  name               = "cams-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_subnet_1.id, aws_subnet.public_subnet_2.id]

  enable_deletion_protection = false

  tags = {
    Environment = var.environment
  }
}

# S3 Bucket for Frontend
resource "aws_s3_bucket" "cams_frontend" {
  bucket = "cams-frontend-${var.environment}-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "cams-frontend-${var.environment}"
    Environment = var.environment
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_website_configuration" "cams_frontend_website" {
  bucket = aws_s3_bucket.cams_frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "cams_frontend_pab" {
  bucket = aws_s3_bucket.cams_frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "cams_frontend_distribution" {
  origin {
    domain_name = aws_s3_bucket_website_configuration.cams_frontend_website.website_endpoint
    origin_id   = "S3-${aws_s3_bucket.cams_frontend.bucket}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.cams_frontend.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  tags = {
    Name        = "cams-frontend-distribution-${var.environment}"
    Environment = var.environment
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "cams_db_subnet_group" {
  name       = "cams-db-subnet-group-${var.environment}"
  subnet_ids = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]

  tags = {
    Name        = "cams-db-subnet-group-${var.environment}"
    Environment = var.environment
  }
}

# RDS Instance
resource "aws_db_instance" "cams_database" {
  identifier = "cams-database-${var.environment}"

  engine         = "sqlserver-ex"
  engine_version = "15.00.4236.7.v1"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "CAMS"
  username = "camsadmin"
  password = "ChangeMeInProduction123!" # Use AWS Secrets Manager in production

  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.cams_db_subnet_group.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Sun:04:00-Sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = {
    Name        = "cams-database-${var.environment}"
    Environment = var.environment
  }
}

# IAM Role for EC2
resource "aws_iam_role" "ec2_role" {
  name = "cams-ec2-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "ec2_policy" {
  name = "cams-ec2-policy-${var.environment}"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "s3:GetObject",
          "s3:PutObject",
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "cams-ec2-profile-${var.environment}"
  role = aws_iam_role.ec2_role.name
}

# Outputs
output "vpc_id" {
  value = aws_vpc.cams_vpc.id
}

output "alb_dns_name" {
  value = aws_lb.cams_alb.dns_name
}

output "rds_endpoint" {
  value = aws_db_instance.cams_database.endpoint
}

output "s3_bucket_name" {
  value = aws_s3_bucket.cams_frontend.bucket
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.cams_frontend_distribution.domain_name
}

output "public_subnet_ids" {
  value = [aws_subnet.public_subnet_1.id, aws_subnet.public_subnet_2.id]
}

output "security_group_ec2" {
  value = aws_security_group.ec2_sg.id
}

output "iam_instance_profile" {
  value = aws_iam_instance_profile.ec2_profile.name
}
```

### 2. Deploy Infrastructure

Create `infrastructure/terraform.tfvars`:
```hcl
aws_region    = "us-east-1"
environment   = "production"
domain_name   = "your-domain.com"
```

Deploy the infrastructure:
```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

## Database Setup

### 1. Connect to RDS Instance

```bash
# Get RDS endpoint from Terraform output
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)

# Connect using SQL Server Management Studio or Azure Data Studio
# Server: $RDS_ENDPOINT
# Username: camsadmin
# Password: ChangeMeInProduction123!
```

### 2. Run Database Migrations

Update `Backend/appsettings.Production.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=<RDS_ENDPOINT>;Database=CAMS;User Id=camsadmin;Password=ChangeMeInProduction123!;TrustServerCertificate=true;MultipleActiveResultSets=true;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "JwtSettings": {
    "Key": "your-super-secure-256-bit-key-here-change-this",
    "Issuer": "CAMS",
    "Audience": "CAMS-Users",
    "ExpirationHours": 24
  },
  "AllowedHosts": "*",
  "CORS": {
    "AllowedOrigins": [
      "https://your-domain.com",
      "https://your-cloudfront-domain.cloudfront.net"
    ]
  }
}
```

Run migrations:
```bash
cd Backend
dotnet ef database update --configuration Production
```

### 3. Seed Initial Data

Create `Backend/Data/ProductionSeeder.cs`:
```csharp
public class ProductionSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, IServiceProvider serviceProvider)
    {
        // Create default admin user
        var userManager = serviceProvider.GetRequiredService<UserManager<User>>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<Role>>();

        // Create roles
        if (!await roleManager.RoleExistsAsync("Administrator"))
        {
            await roleManager.CreateAsync(new Role { Name = "Administrator", Description = "System Administrator" });
        }

        // Create admin user
        if (await userManager.FindByEmailAsync("admin@your-domain.com") == null)
        {
            var adminUser = new User
            {
                UserName = "admin",
                Email = "admin@your-domain.com",
                FirstName = "System",
                LastName = "Administrator",
                IsActive = true,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(adminUser, "Admin@123456");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Administrator");
            }
        }
    }
}
```

## Backend Deployment

### 1. Create Application Image

Create `Backend/Dockerfile.production`:
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5162

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Backend/cams.csproj", "Backend/"]
RUN dotnet restore "Backend/cams.csproj"
COPY . .
WORKDIR "/src/Backend"
RUN dotnet build "cams.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "cams.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Install CloudWatch agent
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    && wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb \
    && dpkg -i amazon-cloudwatch-agent.deb \
    && rm amazon-cloudwatch-agent.deb

ENTRYPOINT ["dotnet", "cams.dll"]
```

### 2. Build and Push to ECR

```bash
# Create ECR repository
aws ecr create-repository --repository-name cams-backend --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag image
docker build -f Backend/Dockerfile.production -t cams-backend .
docker tag cams-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/cams-backend:latest

# Push image
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/cams-backend:latest
```

### 3. Create Launch Template

Create `infrastructure/launch-template.tf`:
```hcl
resource "aws_launch_template" "cams_backend" {
  name_prefix   = "cams-backend-${var.environment}-"
  image_id      = "ami-0c02fb55956c7d316" # Amazon Linux 2023
  instance_type = "t3.small"

  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    ecr_repository = "<account-id>.dkr.ecr.us-east-1.amazonaws.com/cams-backend"
    rds_endpoint   = aws_db_instance.cams_database.endpoint
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "cams-backend-${var.environment}"
      Environment = var.environment
    }
  }
}

resource "aws_autoscaling_group" "cams_backend" {
  name                = "cams-backend-asg-${var.environment}"
  vpc_zone_identifier = [aws_subnet.public_subnet_1.id, aws_subnet.public_subnet_2.id]
  target_group_arns   = [aws_lb_target_group.cams_backend.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 1
  max_size         = 3
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.cams_backend.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "cams-backend-asg-${var.environment}"
    propagate_at_launch = false
  }
}

resource "aws_lb_target_group" "cams_backend" {
  name     = "cams-backend-tg-${var.environment}"
  port     = 5162
  protocol = "HTTP"
  vpc_id   = aws_vpc.cams_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "cams_backend" {
  load_balancer_arn = aws_lb.cams_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.cams_backend.arn
  }
}
```

Create `infrastructure/user_data.sh`:
```bash
#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${ecr_repository}

# Run the application
docker run -d \
  --name cams-backend \
  --restart unless-stopped \
  -p 5162:5162 \
  -e ConnectionStrings__DefaultConnection="Server=${rds_endpoint};Database=CAMS;User Id=camsadmin;Password=ChangeMeInProduction123!;TrustServerCertificate=true;" \
  -e ASPNETCORE_ENVIRONMENT=Production \
  ${ecr_repository}:latest

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/lib/docker/containers/*/*-json.log",
            "log_group_name": "/aws/ec2/cams-backend",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
  -s
```

## Frontend Deployment

### 1. Configure Frontend for Production

Update `frontend/.env.production`:
```env
VITE_APP_API_URL=https://your-domain.com/api
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
VITE_APP_SENTRY_DSN=your-sentry-dsn-here
```

### 2. Build and Deploy to S3

Create `scripts/deploy-frontend.sh`:
```bash
#!/bin/bash

# Configuration
S3_BUCKET=$(terraform -chdir=infrastructure output -raw s3_bucket_name)
CLOUDFRONT_DISTRIBUTION_ID=$(terraform -chdir=infrastructure output -raw cloudfront_distribution_id)

echo "🏗️  Building frontend..."
cd frontend
npm ci
npm run build

echo "📤 Deploying to S3..."
aws s3 sync dist/ s3://$S3_BUCKET --delete --cache-control "public, max-age=31536000"

# Set cache control for HTML files
aws s3 cp s3://$S3_BUCKET/index.html s3://$S3_BUCKET/index.html \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=0, must-revalidate"

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
  --paths "/*"

echo "✅ Frontend deployment complete!"
echo "🌐 URL: https://$(terraform -chdir=infrastructure output -raw cloudfront_domain_name)"
```

Make it executable:
```bash
chmod +x scripts/deploy-frontend.sh
```

## Security Configuration

### 1. Environment Variables Management

Create AWS Systems Manager Parameter Store entries:
```bash
# Database connection string
aws ssm put-parameter \
  --name "/cams/production/database/connection-string" \
  --value "Server=<RDS_ENDPOINT>;Database=CAMS;User Id=camsadmin;Password=<SECURE_PASSWORD>;TrustServerCertificate=true;" \
  --type "SecureString"

# JWT key
aws ssm put-parameter \
  --name "/cams/production/jwt/key" \
  --value "your-super-secure-256-bit-key" \
  --type "SecureString"
```

### 2. Update Backend for Parameter Store

Add to `Backend/Program.cs`:
```csharp
// Add AWS Systems Manager configuration
if (builder.Environment.IsProduction())
{
    builder.Configuration.AddSystemsManager("/cams/production");
}
```

### 3. Security Headers

Add to `Backend/Program.cs`:
```csharp
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    context.Response.Headers.Add("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
    await next();
});
```

### 4. WAF Configuration

Create `infrastructure/waf.tf`:
```hcl
resource "aws_wafv2_web_acl" "cams_waf" {
  name  = "cams-waf-${var.environment}"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "CommonRuleSetMetric"
      sampled_requests_enabled    = true
    }
  }

  rule {
    name     = "RateLimitRule"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "RateLimitRule"
      sampled_requests_enabled    = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                 = "camsWAF"
    sampled_requests_enabled    = true
  }
}
```

## Monitoring & Logging

### 1. CloudWatch Dashboards

Create `infrastructure/monitoring.tf`:
```hcl
resource "aws_cloudwatch_dashboard" "cams_dashboard" {
  dashboard_name = "CAMS-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.cams_alb.arn_suffix],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.cams_alb.arn_suffix],
            ["AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", "LoadBalancer", aws_lb.cams_alb.arn_suffix]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Application Load Balancer"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.cams_database.id],
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", aws_db_instance.cams_database.id]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS Metrics"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "cams-high-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.cams_backend.name
  }
}

resource "aws_sns_topic" "alerts" {
  name = "cams-alerts-${var.environment}"
}

resource "aws_sns_topic_subscription" "email_alerts" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "your-email@your-domain.com"
}
```

### 2. Application Performance Monitoring

Add to `Backend/Program.cs`:
```csharp
// Add AWS X-Ray tracing
builder.Services.AddAWSService<IAmazonXRay>();
builder.Services.AddXRayTracing();

// Add application insights
builder.Services.AddApplicationInsightsTelemetry();
```

## CI/CD Pipeline

### 1. GitHub Actions Secrets

Add these secrets to your GitHub repository:
```
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
ECR_REPOSITORY=<account-id>.dkr.ecr.us-east-1.amazonaws.com/cams-backend
S3_BUCKET=cams-frontend-production-xxxxxxxx
CLOUDFRONT_DISTRIBUTION_ID=EXXXXXXXXXXXXX
```

### 2. Update Deploy Workflow

Update `.github/workflows/deploy.yml`:
```yaml
name: Deploy to AWS Production

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ secrets.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2

    - name: Build, tag, and push image to Amazon ECR
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: cams-backend
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -f Backend/Dockerfile.production -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

    - name: Update Auto Scaling Group
      run: |
        aws autoscaling start-instance-refresh \
          --auto-scaling-group-name cams-backend-asg-production \
          --preferences '{"InstanceWarmup": 300, "MinHealthyPercentage": 50}'

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ secrets.AWS_REGION }}

    - name: Build frontend
      working-directory: ./frontend
      run: |
        npm ci
        npm run build
      env:
        VITE_APP_API_URL: https://your-domain.com/api

    - name: Deploy to S3
      run: |
        aws s3 sync frontend/dist/ s3://${{ secrets.S3_BUCKET }} --delete
        aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

## Domain & SSL Setup

### 1. Route 53 Configuration

```bash
# Create hosted zone
aws route53 create-hosted-zone --name your-domain.com --caller-reference $(date +%s)

# Get name servers and update your domain registrar
aws route53 list-resource-record-sets --hosted-zone-id ZXXXXXXXXXXXXX
```

### 2. SSL Certificate

Create `infrastructure/ssl.tf`:
```hcl
resource "aws_acm_certificate" "cams_cert" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cams_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cams_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "cams_cert" {
  certificate_arn         = aws_acm_certificate.cams_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cams_validation : record.fqdn]
}

resource "aws_route53_zone" "main" {
  name = var.domain_name
}

resource "aws_route53_record" "cams_api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.cams_alb.dns_name
    zone_id                = aws_lb.cams_alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "cams_frontend" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cams_frontend_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.cams_frontend_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}
```

## Backup & Recovery

### 1. Automated RDS Backups

Already configured in the RDS instance:
- 7-day backup retention
- Backup window: 3:00-4:00 AM UTC
- Maintenance window: Sunday 4:00-5:00 AM UTC

### 2. Application Data Backup

Create `scripts/backup.sh`:
```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
S3_BACKUP_BUCKET="cams-backups-production"

echo "📦 Creating database backup..."
aws rds create-db-snapshot \
  --db-instance-identifier cams-database-production \
  --db-snapshot-identifier cams-backup-$DATE

echo "💾 Backing up application files..."
aws s3 sync s3://$S3_BUCKET s3://$S3_BACKUP_BUCKET/frontend/$DATE/

echo "📋 Backing up configuration..."
aws ssm get-parameters-by-path \
  --path "/cams/production" \
  --recursive \
  --with-decryption > /tmp/cams-config-$DATE.json

aws s3 cp /tmp/cams-config-$DATE.json s3://$S3_BACKUP_BUCKET/config/

echo "✅ Backup complete!"
```

### 3. Disaster Recovery Plan

Create `docs/disaster-recovery.md`:
```markdown
# CAMS Disaster Recovery Plan

## Recovery Time Objective (RTO): 4 hours
## Recovery Point Objective (RPO): 1 hour

### Emergency Contacts
- Primary: your-email@your-domain.com
- AWS Support: Enterprise Support Plan

### Recovery Procedures

1. **Database Recovery**
   ```bash
   # Restore from snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier cams-database-recovery \
     --db-snapshot-identifier cams-backup-YYYYMMDD_HHMMSS
   ```

2. **Application Recovery**
   ```bash
   # Deploy to new region
   cd infrastructure
   terraform apply -var="aws_region=us-west-2"
   ```

3. **DNS Failover**
   ```bash
   # Update Route 53 records to point to recovery region
   aws route53 change-resource-record-sets --hosted-zone-id ZXXXXX --change-batch file://failover.json
   ```
```

## Cost Optimization

### 1. Reserved Instances

After 1 month of stable usage:
```bash
# Purchase Reserved Instances for EC2
aws ec2 purchase-reserved-instances-offering \
  --reserved-instances-offering-id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  --instance-count 1

# Purchase Reserved Instances for RDS
aws rds purchase-reserved-db-instances-offering \
  --reserved-db-instances-offering-id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  --db-instance-count 1
```

### 2. Auto Scaling Policies

Create `infrastructure/auto-scaling.tf`:
```hcl
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "cams-scale-up-${var.environment}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.cams_backend.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "cams-scale-down-${var.environment}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.cams_backend.name
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "cams-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.cams_backend.name
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "cams-cpu-low-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.cams_backend.name
  }
}
```

### 3. Cost Monitoring

```bash
# Set up cost alerts
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget file://budget.json
```

Create `budget.json`:
```json
{
  "BudgetName": "CAMS Monthly Budget",
  "BudgetLimit": {
    "Amount": "100",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "CostFilters": {
    "TagKey": ["Environment"],
    "TagValue": ["production"]
  }
}
```

## Scaling Considerations

### 1. Database Scaling

For high traffic, consider:
```hcl
# Read replicas for read-heavy workloads
resource "aws_db_instance" "cams_database_read_replica" {
  identifier = "cams-database-read-replica-${var.environment}"
  
  replicate_source_db = aws_db_instance.cams_database.id
  instance_class      = "db.t3.small"
  
  auto_minor_version_upgrade = true
  backup_retention_period    = 0
  
  tags = {
    Name        = "cams-database-read-replica-${var.environment}"
    Environment = var.environment
  }
}
```

### 2. Application Scaling

```hcl
# Update Auto Scaling Group for higher capacity
resource "aws_autoscaling_group" "cams_backend" {
  min_size         = 2
  max_size         = 10
  desired_capacity = 3
  
  # Enable detailed monitoring
  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]
}
```

### 3. CDN Optimization

```hcl
# Add more CloudFront behaviors for API caching
resource "aws_cloudfront_distribution" "cams_frontend_distribution" {
  # ... existing config ...
  
  ordered_cache_behavior {
    path_pattern     = "/api/static/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-${aws_lb.cams_alb.name}"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 86400
    max_ttl                = 31536000
  }
}
```

## Troubleshooting

### 1. Common Issues

**Issue**: Deployment fails with permission errors
```bash
# Check IAM permissions
aws sts get-caller-identity
aws iam get-user
aws iam list-attached-user-policies --user-name your-username
```

**Issue**: Application can't connect to database
```bash
# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx

# Test database connectivity from EC2
telnet your-rds-endpoint.amazonaws.com 1433
```

**Issue**: Frontend can't reach backend
```bash
# Check CORS configuration in backend
# Verify CloudFront behaviors
aws cloudfront get-distribution-config --id EXXXXXXXXXXXXX
```

### 2. Debugging Commands

```bash
# Check application logs
aws logs describe-log-groups --log-group-name-prefix "/aws/ec2/cams"
aws logs filter-log-events --log-group-name "/aws/ec2/cams-backend" --start-time $(date -d '1 hour ago' +%s)000

# Check load balancer health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/cams-backend-tg-production/1234567890123456

# Check auto scaling group
aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names cams-backend-asg-production

# Check CloudFront
aws cloudfront get-distribution --id EXXXXXXXXXXXXX
```

### 3. Performance Monitoring

```bash
# CPU and memory usage
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=AutoScalingGroupName,Value=cams-backend-asg-production \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# Database performance
aws rds describe-db-instances --db-instance-identifier cams-database-production
```

## Pre-Deployment Checklist

### Infrastructure
- [ ] Domain purchased and DNS configured
- [ ] AWS account set up with billing alerts
- [ ] Terraform infrastructure deployed successfully
- [ ] Security groups configured properly
- [ ] SSL certificate issued and validated

### Application
- [ ] Backend builds without errors
- [ ] Frontend builds without errors
- [ ] Database migrations run successfully
- [ ] Environment variables configured in Parameter Store
- [ ] Docker images pushed to ECR

### Security
- [ ] IAM roles follow principle of least privilege
- [ ] Security groups restrict access appropriately
- [ ] WAF rules configured
- [ ] SSL/TLS enforced
- [ ] Sensitive data stored in Parameter Store

### Monitoring
- [ ] CloudWatch dashboards created
- [ ] Alerts configured for critical metrics
- [ ] Log aggregation working
- [ ] Backup strategy implemented

### CI/CD
- [ ] GitHub Actions workflows tested
- [ ] Secrets configured in GitHub repository
- [ ] Deployment pipeline tested end-to-end

### Documentation
- [ ] README updated with production URLs
- [ ] Disaster recovery plan documented
- [ ] Runbook created for common operations

## Post-Deployment Tasks

1. **Verify Application Functionality**
   - Test user registration and login
   - Verify database connections work
   - Test application management features
   - Check all API endpoints

2. **Performance Testing**
   - Run load tests
   - Monitor response times
   - Verify auto-scaling works

3. **Security Testing**
   - Run security scans
   - Test WAF rules
   - Verify SSL configuration

4. **Backup Testing**
   - Test database restore procedures
   - Verify backup automation

5. **Documentation Updates**
   - Update README with production URLs
   - Document any configuration changes
   - Update API documentation

## Estimated Costs

| Service | Monthly Cost (estimated) |
|---------|-------------------------|
| EC2 (2x t3.small) | $30 |
| RDS (db.t3.micro SQL Server) | $25 |
| Application Load Balancer | $20 |
| S3 + CloudFront | $5 |
| Route 53 | $0.50 |
| Data Transfer | $10 |
| CloudWatch | $5 |
| **Total** | **~$95/month** |

**Cost Optimization Tips:**
- Use Reserved Instances after 1 month for 30-60% savings
- Enable detailed monitoring only for critical metrics
- Use S3 Intelligent Tiering for static assets
- Implement auto-scaling to reduce costs during low traffic

---

## Support

For issues during deployment:
1. Check the [troubleshooting section](#troubleshooting)
2. Review AWS CloudWatch logs
3. Consult AWS documentation
4. Contact AWS support if needed

**Good luck with your AWS deployment! 🚀**

Remember to:
- Start small and scale up
- Monitor costs closely
- Keep security as a priority
- Document everything you do
- Test disaster recovery procedures

This deployment will give you a production-ready, scalable CAMS application on AWS that can handle real-world traffic and growth.
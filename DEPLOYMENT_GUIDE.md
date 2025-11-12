# Deployment Guide - SOVD Log Dashboard

## Overview

This guide covers deploying the SOVD Log Dashboard to various environments with full WebSocket support.

---

## Table of Contents

1. [Docker Deployment](#docker-deployment)
2. [Docker Compose (Recommended for Development)](#docker-compose)
3. [AWS Deployment](#aws-deployment)
4. [Azure Deployment](#azure-deployment)
5. [Google Cloud Platform](#google-cloud-platform)
6. [PM2 Process Manager](#pm2-process-manager)
7. [Nginx Reverse Proxy](#nginx-reverse-proxy)
8. [SSL/TLS Configuration](#ssltls-configuration)
9. [Production Checklist](#production-checklist)

---

## Docker Deployment

### Build Docker Image

```bash
# Build the image
docker build -t sovd-log-dashboard:latest .

# Build with custom tag
docker build -t your-registry/sovd-log-dashboard:1.0.0 .
```

### Run Docker Container

```bash
# Basic run
docker run -p 3000:3000 \
  -e DB_HOST=your-db-host \
  -e DB_PORT=3306 \
  -e DB_USER=root \
  -e DB_PASSWORD=your-password \
  -e DB_NAME=log_dashboard \
  sovd-log-dashboard:latest

# With volume for logs
docker run -p 3000:3000 \
  -v /var/log/dashboard:/app/logs \
  -e DB_HOST=your-db-host \
  -e DB_PORT=3306 \
  -e DB_USER=root \
  -e DB_PASSWORD=your-password \
  -e DB_NAME=log_dashboard \
  sovd-log-dashboard:latest

# With network
docker network create dashboard-network
docker run -p 3000:3000 \
  --network dashboard-network \
  --name log-dashboard \
  -e DB_HOST=mysql-server \
  -e DB_PORT=3306 \
  -e DB_USER=root \
  -e DB_PASSWORD=your-password \
  -e DB_NAME=log_dashboard \
  sovd-log-dashboard:latest
```

### Check Container Health

```bash
# View logs
docker logs log-dashboard

# Check health status
docker inspect --format='{{.State.Health}}' log-dashboard

# Tail logs in real-time
docker logs -f log-dashboard

# Execute commands in container
docker exec -it log-dashboard /bin/sh
```

---

## Docker Compose

### Start Full Stack (Recommended for Development)

```bash
# Copy environment file
cp .env.example .env

# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Docker Compose Features

The included `docker-compose.yml` provides:
- MySQL database with automatic initialization
- App service with WebSocket support
- Health checks for both services
- Automatic service dependency management
- Persistent database volume

### Configuration

Edit environment variables in `.env`:

```env
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=log_dashboard
APP_PORT=3000
```

---

## AWS Deployment

### Option 1: EC2 with Docker

**Prerequisites:**
- EC2 instance (t3.medium or larger recommended)
- Ubuntu 20.04 or later
- Security group with ports 80, 443, 3000 open

**Steps:**

```bash
# 1. SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# 2. Install Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# 3. Add user to docker group
sudo usermod -aG docker ubuntu

# 4. Clone repository
git clone https://github.com/your-org/sovd-log-dashboard.git
cd sovd-log-dashboard

# 5. Configure environment
cp .env.example .env
# Edit .env with your AWS RDS endpoint

# 6. Start services
docker-compose up -d

# 7. Setup Nginx (see Nginx section below)
```

### Option 2: ECS Fargate

Create ECS task definition for WebSocket support:

```json
{
  "family": "sovd-log-dashboard",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "your-registry/sovd-log-dashboard:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DB_HOST",
          "value": "your-rds-endpoint"
        },
        {
          "name": "DB_PORT",
          "value": "3306"
        },
        {
          "name": "DB_USER",
          "value": "admin"
        },
        {
          "name": "DB_NAME",
          "value": "log_dashboard"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/sovd-log-dashboard",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

### RDS Configuration for WebSocket

When using AWS RDS MySQL:
- Ensure security group allows inbound on port 3306
- Use connection pooling (already configured in app)
- Enable automatic backups
- Monitor CPU and connections via CloudWatch

---

## Azure Deployment

### Option 1: Azure Container Instances (ACI)

```bash
# Create resource group
az group create --name sovd-log-dashboard --location eastus

# Create container registry
az acr create --resource-group sovd-log-dashboard \
  --name sovdregistry --sku Basic

# Build and push image
az acr build --registry sovdregistry \
  --image sovd-log-dashboard:latest .

# Deploy to ACI
az container create \
  --resource-group sovd-log-dashboard \
  --name log-dashboard \
  --image sovdregistry.azurecr.io/sovd-log-dashboard:latest \
  --ports 3000 \
  --environment-variables \
    DB_HOST="your-db.mysql.database.azure.com" \
    DB_USER="admin" \
    DB_NAME="log_dashboard" \
  --secrets \
    DB_PASSWORD="your-password" \
  --registry-login-server sovdregistry.azurecr.io \
  --registry-username "username" \
  --registry-password "password"
```

### Option 2: Azure App Service

```bash
# Create App Service plan
az appservice plan create \
  --name log-dashboard-plan \
  --resource-group sovd-log-dashboard \
  --sku B2 --is-linux

# Create web app
az webapp create \
  --resource-group sovd-log-dashboard \
  --plan log-dashboard-plan \
  --name log-dashboard-app \
  --deployment-container-image-name sovdregistry.azurecr.io/sovd-log-dashboard:latest

# Configure web app for WebSocket
az webapp config appsettings set \
  --resource-group sovd-log-dashboard \
  --name log-dashboard-app \
  --settings \
    DB_HOST="your-db.mysql.database.azure.com" \
    DB_USER="admin" \
    DB_NAME="log_dashboard" \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE="true"
```

---

## Google Cloud Platform

### Cloud Run Deployment

```bash
# Build image
gcloud builds submit --tag gcr.io/YOUR_PROJECT/sovd-log-dashboard

# Deploy to Cloud Run
gcloud run deploy log-dashboard \
  --image gcr.io/YOUR_PROJECT/sovd-log-dashboard \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars DB_HOST="your-cloudsql-instance" \
  --set-env-vars DB_USER="root" \
  --set-env-vars DB_NAME="log_dashboard"

# Note: Cloud Run has limitations with long-lived WebSocket connections
# For production WebSocket, use GKE instead
```

### GKE (Google Kubernetes Engine)

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sovd-log-dashboard
spec:
  replicas: 3
  selector:
    matchLabels:
      app: log-dashboard
  template:
    metadata:
      labels:
        app: log-dashboard
    spec:
      containers:
      - name: app
        image: gcr.io/YOUR_PROJECT/sovd-log-dashboard:latest
        ports:
        - containerPort: 3000
        env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: db-host
        - name: DB_USER
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: db-user
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: db-password
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

Deploy with:

```bash
kubectl apply -f k8s/deployment.yaml
kubectl expose deployment sovd-log-dashboard --type=LoadBalancer --port=3000
```

---

## PM2 Process Manager

### Install PM2

```bash
npm install -g pm2
```

### Start Application

```bash
# Start with default settings
pm2 start server.js --name "log-dashboard"

# Start with custom configuration
pm2 start server.js --name "log-dashboard" \
  --env DB_HOST=localhost \
  --env DB_USER=root \
  --env DB_PASSWORD=your_password

# Start with ecosystem file (recommended)
pm2 start ecosystem.config.js
```

### Create Ecosystem File

`ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'log-dashboard',
      script: 'server.js',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production',
        DB_HOST: 'localhost',
        DB_PORT: 3306,
        DB_USER: 'root',
        DB_PASSWORD: 'your_password',
        DB_NAME: 'log_dashboard',
      },
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
    },
  ],
}
```

### Monitor with PM2

```bash
# View all processes
pm2 list

# Monitor in real-time
pm2 monit

# View logs
pm2 logs log-dashboard

# View specific number of logs
pm2 logs log-dashboard --lines 100

# Save startup script
pm2 save
pm2 startup

# Restart all
pm2 restart all

# Stop specific app
pm2 stop log-dashboard

# Delete app
pm2 delete log-dashboard
```

---

## Nginx Reverse Proxy

### Install Nginx

```bash
# Ubuntu/Debian
sudo apt-get install -y nginx

# macOS
brew install nginx
```

### Configuration

`/etc/nginx/sites-available/log-dashboard`:

```nginx
# Upstream server
upstream log_dashboard {
    server localhost:3000;
    # For clustering, add multiple servers:
    # server localhost:3001;
    # server localhost:3002;
    keepalive 64;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # Proxy settings
    location / {
        proxy_pass http://log_dashboard;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket settings
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://log_dashboard;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /public/ {
        alias /path/to/app/public/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/log-dashboard /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Or on macOS
brew services restart nginx
```

---

## SSL/TLS Configuration

### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify renewal
sudo certbot renew --dry-run
```

### Self-Signed Certificate (Development Only)

```bash
# Generate certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update Nginx config with paths to cert.pem and key.pem
```

---

## Production Checklist

### Pre-Deployment

- [ ] Database backed up
- [ ] All environment variables configured
- [ ] SSL/TLS certificates obtained
- [ ] Firewall rules configured
- [ ] Load balancer configured (if needed)
- [ ] Monitoring and alerting setup
- [ ] Log aggregation configured

### Deployment

- [ ] Build Docker image successfully
- [ ] All health checks pass
- [ ] Database migrations run successfully
- [ ] WebSocket connections tested
- [ ] API endpoints responding correctly
- [ ] Static assets loading correctly
- [ ] Performance acceptable (< 100ms latency)

### Post-Deployment

- [ ] Monitor error logs
- [ ] Check application performance
- [ ] Verify WebSocket connections working
- [ ] Test with production data volume
- [ ] Monitor database performance
- [ ] Setup automated backups
- [ ] Configure alerts for critical metrics

### Ongoing Monitoring

```bash
# CPU and memory usage
top
ps aux | grep node

# Disk usage
df -h

# Network connections
netstat -an | grep 3000

# Database connections
mysql -u root -p -e "SHOW STATUS WHERE variable_name IN ('Threads_connected', 'Threads_running');"

# Log files
tail -f /var/log/app.log
pm2 logs log-dashboard
```

---

## Scaling Considerations

### Horizontal Scaling

For 1000+ concurrent WebSocket connections:

1. **Multiple Instances**: Run 2-3 instances with load balancer
2. **Sticky Sessions**: Ensure WebSocket connections stick to same instance
3. **Connection Pooling**: Use connection pool for database
4. **Read Replicas**: Add MySQL read replicas for stats queries

### Vertical Scaling

For single instance improvements:
1. Increase server RAM (to 4GB+)
2. Increase CPU cores
3. Enable database caching
4. Enable compression for API responses

---

## Support & Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
lsof -i :3000
kill -9 <PID>
```

**Database Connection Failed:**
```bash
mysql -h your-db-host -u root -p -e "SHOW STATUS;"
```

**WebSocket Connections Failing:**
```bash
# Check Nginx WebSocket proxy settings
# Verify Upgrade and Connection headers are forwarded
curl -i -H "Upgrade: websocket" http://yourdomain.com
```

### Performance Tuning

**Nginx:**
```nginx
# Increase worker connections
events {
    worker_connections 4096;
}

# Enable caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;
location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 10m;
}
```

**MySQL:**
```bash
# Increase max connections
mysql> SET GLOBAL max_connections = 1000;

# Check current connections
mysql> SHOW STATUS WHERE variable_name = 'Threads_connected';
```

---

## References

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [AWS Deployment](https://docs.aws.amazon.com/)
- [Azure Deployment](https://docs.microsoft.com/en-us/azure/)

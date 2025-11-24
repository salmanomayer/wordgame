# Docker Setup Guide for Word Game

This guide explains how to run the Word Game application using Docker and Docker Compose.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher

### Installing Docker

#### macOS
\`\`\`bash
# Install Docker Desktop for Mac
# Download from: https://www.docker.com/products/docker-desktop

# Or using Homebrew
brew install --cask docker
\`\`\`

#### Linux (Ubuntu/Debian)
\`\`\`bash
# Update package index
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker
\`\`\`

#### Windows
Download and install Docker Desktop from: https://www.docker.com/products/docker-desktop

---

## Quick Start

### 1. Setup Environment Variables

Copy the example environment file and configure it with your Supabase credentials:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and add your Supabase credentials:
- Database connection strings
- Supabase URL and keys
- JWT secrets

### 2. Build and Run (Production)

\`\`\`bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
\`\`\`

Your application will be available at: http://localhost:3000

### 3. Development Mode with Hot-Reloading

For development with automatic code reloading:

\`\`\`bash
# Build and start development container
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop
docker-compose -f docker-compose.dev.yml down
\`\`\`

---

## Docker Commands Reference

### Building

\`\`\`bash
# Build the production image
docker-compose build

# Build without cache (force rebuild)
docker-compose build --no-cache

# Build specific service
docker-compose build word-game-app
\`\`\`

### Running

\`\`\`bash
# Start in detached mode
docker-compose up -d

# Start and view logs
docker-compose up

# Start specific service
docker-compose up word-game-app
\`\`\`

### Stopping

\`\`\`bash
# Stop containers
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers, networks, and volumes
docker-compose down -v
\`\`\`

### Logs

\`\`\`bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for specific service
docker-compose logs -f word-game-app

# View last 100 lines
docker-compose logs --tail=100
\`\`\`

### Executing Commands

\`\`\`bash
# Open shell in running container
docker-compose exec word-game-app sh

# Run a command in container
docker-compose exec word-game-app node --version

# Run pnpm command
docker-compose exec word-game-app pnpm install
\`\`\`

---

## Configuration

### Environment Variables

All environment variables should be defined in `.env` file:

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_URL` | PostgreSQL connection string | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `JWT_SECRET` | JWT secret for authentication | Yes |

### Port Configuration

By default, the application runs on port 3000. To change:

1. Edit `docker-compose.yml`:
\`\`\`yaml
ports:
  - "8080:3000"  # Change 8080 to your desired port
\`\`\`

2. Rebuild and restart:
\`\`\`bash
docker-compose down
docker-compose up -d
\`\`\`

### Volume Configuration

Volumes are used to persist data:

\`\`\`yaml
volumes:
  - ./logs:/app/logs  # Application logs
\`\`\`

---

## Production Deployment

### 1. Optimize for Production

Update `next.config.mjs` to enable standalone output:

\`\`\`javascript
const nextConfig = {
  output: 'standalone',
  // ... other config
}
\`\`\`

### 2. Build Production Image

\`\`\`bash
# Build production image
docker-compose build

# Tag for registry
docker tag word-game-app:latest your-registry.com/word-game-app:v1.0.0

# Push to registry
docker push your-registry.com/word-game-app:v1.0.0
\`\`\`

### 3. Deploy to Server

On your production server:

\`\`\`bash
# Pull the image
docker pull your-registry.com/word-game-app:v1.0.0

# Create .env file with production credentials
nano .env

# Start the application
docker-compose up -d

# Check health
docker-compose ps
docker-compose logs -f
\`\`\`

### 4. Setup Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/word-game`:

\`\`\`nginx
server {
    listen 80;
    server_name wordpuzzlegame.com www.wordpuzzlegame.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

Enable and restart Nginx:

\`\`\`bash
sudo ln -s /etc/nginx/sites-available/word-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

### 5. Setup SSL with Let's Encrypt

\`\`\`bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d wordpuzzlegame.com -d www.wordpuzzlegame.com

# Auto-renewal
sudo certbot renew --dry-run
\`\`\`

---

## Troubleshooting

### Container Won't Start

\`\`\`bash
# Check logs
docker-compose logs

# Check if port is already in use
sudo lsof -i :3000

# Remove old containers
docker-compose down
docker system prune -a
\`\`\`

### Database Connection Issues

\`\`\`bash
# Verify environment variables
docker-compose exec word-game-app env | grep POSTGRES

# Test database connection
docker-compose exec word-game-app node -e "console.log(process.env.POSTGRES_URL)"
\`\`\`

### Build Failures

\`\`\`bash
# Clear build cache
docker-compose build --no-cache

# Check Dockerfile syntax
docker-compose config

# View build output
docker-compose up --build
\`\`\`

### Memory Issues

Add memory limits to `docker-compose.yml`:

\`\`\`yaml
services:
  word-game-app:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 512M
\`\`\`

### Performance Optimization

\`\`\`bash
# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build with BuildKit
docker-compose build
\`\`\`

---

## Monitoring

### Health Checks

The application includes a health check endpoint:

\`\`\`bash
# Check container health
docker-compose ps

# Manual health check
curl http://localhost:3000
\`\`\`

### Resource Usage

\`\`\`bash
# View container stats
docker stats

# View specific container
docker stats word-game-app
\`\`\`

### Log Rotation

Configure log rotation in `docker-compose.yml`:

\`\`\`yaml
services:
  word-game-app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
\`\`\`

---

## Backup and Restore

### Backup Container Data

\`\`\`bash
# Create backup
docker run --rm --volumes-from word-game-app \
  -v $(pwd):/backup alpine \
  tar czf /backup/word-game-backup.tar.gz /app/logs

# Backup database (from Supabase)
# Use Supabase dashboard or pg_dump command
\`\`\`

### Restore Container Data

\`\`\`bash
# Restore files
docker run --rm --volumes-from word-game-app \
  -v $(pwd):/backup alpine \
  tar xzf /backup/word-game-backup.tar.gz -C /
\`\`\`

---

## Switching from Development to Production

1. **Update Environment Variables**:
   - Change `NODE_ENV=production` in `.env`
   - Update Supabase URLs to production endpoints
   - Update redirect URLs

2. **Rebuild Container**:
   \`\`\`bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   \`\`\`

3. **Verify Deployment**:
   \`\`\`bash
   docker-compose logs -f
   curl http://localhost:3000
   \`\`\`

---

## Migration from Local Development

### Before Migration

\`\`\`bash
# Export local database schema (if needed)
# This is typically not needed as Supabase is already set up
\`\`\`

### After Docker Setup

\`\`\`bash
# All SQL scripts in /scripts folder are already available
# Run them through Supabase if not already executed
\`\`\`

---

## Useful Scripts

### Create `docker-helpers.sh`

\`\`\`bash
#!/bin/bash

# Start production
alias docker-prod="docker-compose up -d"

# Start development
alias docker-dev="docker-compose -f docker-compose.dev.yml up -d"

# View logs
alias docker-logs="docker-compose logs -f"

# Stop all
alias docker-stop="docker-compose down"

# Rebuild
alias docker-rebuild="docker-compose down && docker-compose build --no-cache && docker-compose up -d"

# Shell access
alias docker-shell="docker-compose exec word-game-app sh"
\`\`\`

Make it executable:
\`\`\`bash
chmod +x docker-helpers.sh
source docker-helpers.sh
\`\`\`

---

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use Docker secrets** for sensitive data in production:
   \`\`\`yaml
   secrets:
     db_password:
       external: true
   \`\`\`
3. **Run as non-root user** (already configured in Dockerfile)
4. **Keep images updated**: `docker-compose pull && docker-compose up -d`
5. **Scan for vulnerabilities**: `docker scan word-game-app:latest`

---

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Verify environment variables: `docker-compose config`
- Review Supabase connection in dashboard
- Contact: info@wordpuzzlegame.com

---

## Additional Resources

- Docker Documentation: https://docs.docker.com
- Docker Compose Documentation: https://docs.docker.com/compose
- Next.js Docker Documentation: https://nextjs.org/docs/deployment#docker-image
- Supabase Documentation: https://supabase.com/docs

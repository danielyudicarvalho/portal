#!/bin/bash

set -e

echo "🐳 Starting Game Portal with Docker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1 && ! docker compose version > /dev/null 2>&1; then
    print_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Use docker compose if available, otherwise fall back to docker-compose
DOCKER_COMPOSE_CMD="docker compose"
if ! docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
fi

print_status "Using: $DOCKER_COMPOSE_CMD"

# Stop any existing containers
print_status "Stopping existing containers..."
$DOCKER_COMPOSE_CMD down --remove-orphans

# Clean up old images if requested
if [ "$1" = "--clean" ]; then
    print_status "Cleaning up old images..."
    docker system prune -f
    docker volume prune -f
fi

# Build and start services
print_status "Building and starting services..."
$DOCKER_COMPOSE_CMD up --build -d

# Wait for services to be healthy
print_status "Waiting for services to be ready..."

# Function to check service health
check_service_health() {
    local service_name=$1
    local health_url=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$health_url" > /dev/null 2>&1; then
            print_success "$service_name is healthy"
            return 0
        fi
        
        print_status "Waiting for $service_name... (attempt $attempt/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to become healthy"
    return 1
}

# Wait for database
print_status "Waiting for PostgreSQL..."
sleep 10

# Check if database is ready
if $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U gameuser -d game_portal > /dev/null 2>&1; then
    print_success "PostgreSQL is ready"
else
    print_warning "PostgreSQL might not be fully ready yet"
fi

# Wait for Redis
print_status "Waiting for Redis..."
if $DOCKER_COMPOSE_CMD exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is ready"
else
    print_warning "Redis might not be fully ready yet"
fi

# Wait for application
print_status "Waiting for application to be ready..."
sleep 15

# Check application health
if check_service_health "Application" "http://localhost:3000/api/health"; then
    print_success "Application is running"
else
    print_warning "Application health check failed, but it might still be starting"
fi

# Check multiplayer server
if check_service_health "Multiplayer Server" "http://localhost:3002/health"; then
    print_success "Multiplayer server is running"
else
    print_warning "Multiplayer server health check failed, but it might still be starting"
fi

# Show running containers
print_status "Running containers:"
$DOCKER_COMPOSE_CMD ps

# Show logs for any failed services
failed_services=$($DOCKER_COMPOSE_CMD ps --filter "status=exited" --format "table {{.Service}}" | tail -n +2)
if [ -n "$failed_services" ]; then
    print_warning "Some services failed to start:"
    echo "$failed_services"
    print_status "Showing logs for failed services..."
    for service in $failed_services; do
        print_status "Logs for $service:"
        $DOCKER_COMPOSE_CMD logs --tail=20 "$service"
    done
fi

echo ""
print_success "🎮 Game Portal is starting up!"
echo ""
echo "📱 Application: http://localhost:3000"
echo "🎯 Multiplayer: ws://localhost:3002"
echo "🗄️  Database: localhost:5432"
echo "🔴 Redis: localhost:6379"
echo ""
echo "📊 Health checks:"
echo "   App: http://localhost:3000/api/health"
echo "   Multiplayer: http://localhost:3002/health"
echo ""
echo "📋 Useful commands:"
echo "   View logs: $DOCKER_COMPOSE_CMD logs -f"
echo "   Stop services: $DOCKER_COMPOSE_CMD down"
echo "   Restart: $DOCKER_COMPOSE_CMD restart"
echo "   Shell access: $DOCKER_COMPOSE_CMD exec app sh"
echo ""
print_status "Use '$DOCKER_COMPOSE_CMD logs -f' to follow the logs"
#!/bin/bash

set -e

echo "🐳 Starting Game Portal in Development Mode..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Use docker compose if available, otherwise fall back to docker-compose
DOCKER_COMPOSE_CMD="docker compose"
if ! docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
fi

print_status "Using: $DOCKER_COMPOSE_CMD"

# Stop any existing containers
print_status "Stopping existing containers..."
$DOCKER_COMPOSE_CMD -f docker-compose.dev.yml down --remove-orphans

# Build and start services
print_status "Building and starting development services..."
$DOCKER_COMPOSE_CMD -f docker-compose.dev.yml up --build

print_success "🎮 Development environment started!"
echo ""
echo "📱 Application: http://localhost:3000"
echo "🎯 Multiplayer: ws://localhost:3002"
echo "🗄️  Database: localhost:5432"
echo "🔴 Redis: localhost:6379"
#!/bin/bash

set -e

echo "🧪 Testing Docker Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Use docker compose if available, otherwise fall back to docker-compose
DOCKER_COMPOSE_CMD="docker compose"
if ! docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# Test 1: Check if containers are running
print_status "Checking if containers are running..."
if $DOCKER_COMPOSE_CMD ps | grep -q "Up"; then
    print_success "Containers are running"
else
    print_error "No containers are running. Start with: npm run docker:start"
    exit 1
fi

# Test 2: Check database connection
print_status "Testing database connection..."
if $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U gameuser -d game_portal > /dev/null 2>&1; then
    print_success "Database is accessible"
else
    print_error "Database connection failed"
fi

# Test 3: Check Redis connection
print_status "Testing Redis connection..."
if $DOCKER_COMPOSE_CMD exec -T redis redis-cli ping | grep -q "PONG"; then
    print_success "Redis is accessible"
else
    print_error "Redis connection failed"
fi

# Test 4: Check application health
print_status "Testing application health..."
sleep 5  # Give app time to start
if curl -f -s "http://localhost:3000/api/health" > /dev/null; then
    print_success "Application is healthy"
else
    print_error "Application health check failed"
fi

# Test 5: Check multiplayer server health
print_status "Testing multiplayer server health..."
if curl -f -s "http://localhost:3002/health" > /dev/null; then
    print_success "Multiplayer server is healthy"
else
    print_error "Multiplayer server health check failed"
fi

# Test 6: Check if main pages load
print_status "Testing main application pages..."
if curl -f -s "http://localhost:3000" > /dev/null; then
    print_success "Home page loads"
else
    print_error "Home page failed to load"
fi

if curl -f -s "http://localhost:3000/games" > /dev/null; then
    print_success "Games page loads"
else
    print_error "Games page failed to load"
fi

if curl -f -s "http://localhost:3000/games/championship" > /dev/null; then
    print_success "Championship page loads"
else
    print_error "Championship page failed to load"
fi

# Test 7: Check scoring API
print_status "Testing scoring API..."
if curl -f -s "http://localhost:3000/api/games/memdot/scores?period=ALL_TIME&limit=5" > /dev/null; then
    print_success "Scoring API is accessible"
else
    print_error "Scoring API failed"
fi

echo ""
print_success "🎉 Docker setup test completed!"
echo ""
echo "📊 Service Status:"
$DOCKER_COMPOSE_CMD ps
echo ""
echo "🔗 Access URLs:"
echo "   🏠 Home: http://localhost:3000"
echo "   🎮 Games: http://localhost:3000/games"
echo "   🏆 Championship: http://localhost:3000/games/championship"
echo "   🎯 Memdot Championship: http://localhost:3000/games/memdot/championship"
echo "   🧪 Test Scoring: http://localhost:3000/test-scoring"
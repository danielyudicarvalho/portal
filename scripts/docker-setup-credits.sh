#!/bin/bash

set -e

echo "💳 Setting up Game Portal with Credit System using Docker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[SETUP]${NC} $1"
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

print_info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Use docker compose if available, otherwise fall back to docker-compose
DOCKER_COMPOSE_CMD="docker compose"
if ! docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
fi

print_status "Using: $DOCKER_COMPOSE_CMD"

# Clean up if requested
if [ "$1" = "--clean" ]; then
    print_status "Cleaning up existing setup..."
    $DOCKER_COMPOSE_CMD down --volumes --remove-orphans
    docker system prune -f
    docker volume prune -f
fi

# Stop any existing containers
print_status "Stopping existing containers..."
$DOCKER_COMPOSE_CMD down --remove-orphans

# Build and start services
print_status "Building and starting services..."
$DOCKER_COMPOSE_CMD up --build -d

# Wait for database to be ready
print_status "Waiting for database to be ready..."
sleep 15

# Check database connection
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U gameuser -d game_portal > /dev/null 2>&1; then
        print_success "Database is ready"
        break
    fi
    
    print_status "Waiting for database... (attempt $attempt/$max_attempts)"
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    print_error "Database failed to become ready"
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
$DOCKER_COMPOSE_CMD exec -T app npx prisma migrate deploy

# Generate Prisma client
print_status "Generating Prisma client..."
$DOCKER_COMPOSE_CMD exec -T app npx prisma generate

# Seed the database with games and basic data
print_status "Seeding database with games..."
$DOCKER_COMPOSE_CMD exec -T app npm run db:seed

# Seed the credit system
print_status "Seeding credit system..."
$DOCKER_COMPOSE_CMD exec -T app node scripts/seed-credits.js

# Wait for application to be ready
print_status "Waiting for application to be ready..."
sleep 10

# Check application health
max_attempts=20
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -f -s "http://localhost:3000/api/health" > /dev/null; then
        print_success "Application is ready"
        break
    fi
    
    print_status "Waiting for application... (attempt $attempt/$max_attempts)"
    sleep 3
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    print_warning "Application health check failed, but it might still be starting"
fi

# Show container status
print_status "Container status:"
$DOCKER_COMPOSE_CMD ps

echo ""
print_success "🎉 Game Portal with Credit System is ready!"
echo ""
print_info "📊 What's been set up:"
echo "   ✅ PostgreSQL database with credit system schema"
echo "   ✅ Redis for caching and multiplayer"
echo "   ✅ Next.js application with credit features"
echo "   ✅ Multiplayer server"
echo "   ✅ Credit packages (4 different packages)"
echo "   ✅ Game costs (10/25/15 credits for standard/championship/multiplayer)"
echo "   ✅ Free credits for existing users (50 credits)"
echo ""
print_info "🔗 Access URLs:"
echo "   🏠 Home: http://localhost:3000"
echo "   💳 Credits: http://localhost:3000/credits"
echo "   🎮 Games: http://localhost:3000/games"
echo "   🎯 Memdot: http://localhost:3000/games/memdot"
echo "   🏆 Championship: http://localhost:3000/games/memdot/championship"
echo "   👨‍💼 Admin: http://localhost:3000/admin/credits"
echo "   🔧 Health: http://localhost:3000/api/health"
echo ""
print_info "💡 Testing the Credit System:"
echo "   1. Sign in with Google OAuth"
echo "   2. Check your credit balance (50 free credits)"
echo "   3. Go to /credits to see purchase options"
echo "   4. Try playing a game (costs 10 credits)"
echo "   5. Try championship mode (costs 25 credits)"
echo "   6. Use Stripe test card: 4242 4242 4242 4242"
echo ""
print_info "🛠️ Useful commands:"
echo "   View logs: $DOCKER_COMPOSE_CMD logs -f"
echo "   Test system: ./scripts/docker-test-credits.sh"
echo "   Stop services: $DOCKER_COMPOSE_CMD down"
echo "   Database shell: $DOCKER_COMPOSE_CMD exec postgres psql -U gameuser -d game_portal"
echo "   App shell: $DOCKER_COMPOSE_CMD exec app sh"
echo ""
print_status "Run './scripts/docker-test-credits.sh' to test the credit system"
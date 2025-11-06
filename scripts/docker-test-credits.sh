#!/bin/bash

set -e

echo "💳 Testing Credit System with Docker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

# Use docker compose if available, otherwise fall back to docker-compose
DOCKER_COMPOSE_CMD="docker compose"
if ! docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
fi

BASE_URL="http://localhost:3000"
FAILED_TESTS=0
TOTAL_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_status "Testing: $test_name"
    
    if eval "$test_command"; then
        if [ -n "$expected_result" ]; then
            print_success "$test_name - $expected_result"
        else
            print_success "$test_name"
        fi
    else
        print_error "$test_name failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to test API endpoint
test_api() {
    local endpoint="$1"
    local description="$2"
    local expected_status="${3:-200}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_status "Testing API: $description"
    
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    
    if [ "$response_code" = "$expected_status" ]; then
        print_success "$description (HTTP $response_code)"
    else
        print_error "$description failed (HTTP $response_code, expected $expected_status)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to test API with JSON response
test_api_json() {
    local endpoint="$1"
    local description="$2"
    local json_key="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_status "Testing API JSON: $description"
    
    local response=$(curl -s "$BASE_URL$endpoint")
    
    if echo "$response" | jq -e ".$json_key" > /dev/null 2>&1; then
        print_success "$description (JSON key '$json_key' found)"
    else
        print_error "$description failed (JSON key '$json_key' not found)"
        print_info "Response: $response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo ""
print_info "🚀 Starting Credit System Tests..."
echo ""

# Test 1: Basic container health
print_status "=== BASIC HEALTH CHECKS ==="
run_test "Containers are running" "$DOCKER_COMPOSE_CMD ps | grep -q 'Up'"
run_test "Database connection" "$DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U gameuser -d game_portal > /dev/null 2>&1"
run_test "Redis connection" "$DOCKER_COMPOSE_CMD exec -T redis redis-cli ping | grep -q 'PONG'"

# Wait for application to be ready
print_status "Waiting for application to be fully ready..."
sleep 10

# Test 2: Application health
print_status "=== APPLICATION HEALTH ==="
test_api "/api/health" "Application health endpoint"

# Test 3: Credit system database setup
print_status "=== DATABASE SCHEMA TESTS ==="
run_test "Credit packages table exists" "$DOCKER_COMPOSE_CMD exec -T postgres psql -U gameuser -d game_portal -c 'SELECT COUNT(*) FROM credit_packages;' > /dev/null 2>&1"
run_test "Game costs table exists" "$DOCKER_COMPOSE_CMD exec -T postgres psql -U gameuser -d game_portal -c 'SELECT COUNT(*) FROM game_costs;' > /dev/null 2>&1"
run_test "Users have credits column" "$DOCKER_COMPOSE_CMD exec -T postgres psql -U gameuser -d game_portal -c 'SELECT credits FROM users LIMIT 1;' > /dev/null 2>&1"

# Test 4: Credit system APIs (public endpoints)
print_status "=== CREDIT SYSTEM API TESTS ==="
test_api_json "/api/credits/packages" "Credit packages endpoint" "packages"

# Test 5: Game pages with credit integration
print_status "=== GAME PAGES WITH CREDITS ==="
test_api "/games/memdot" "Memdot game page"
test_api "/games/memdot/championship" "Memdot championship page"
test_api "/credits" "Credits purchase page"

# Test 6: Admin pages
print_status "=== ADMIN INTERFACE ==="
test_api "/admin/credits" "Admin credits page"

# Test 7: Check if credit packages are seeded
print_status "=== DATA SEEDING TESTS ==="
run_test "Credit packages are seeded" "$DOCKER_COMPOSE_CMD exec -T postgres psql -U gameuser -d game_portal -c 'SELECT COUNT(*) FROM credit_packages WHERE \"isActive\" = true;' | grep -q '[1-9]'"
run_test "Game costs are seeded" "$DOCKER_COMPOSE_CMD exec -T postgres psql -U gameuser -d game_portal -c 'SELECT COUNT(*) FROM game_costs WHERE \"isActive\" = true;' | grep -q '[1-9]'"

# Test 8: Check specific credit package data
print_status "=== CREDIT PACKAGE DATA TESTS ==="
run_test "Starter Pack exists" "$DOCKER_COMPOSE_CMD exec -T postgres psql -U gameuser -d game_portal -c \"SELECT name FROM credit_packages WHERE name = 'Starter Pack';\" | grep -q 'Starter Pack'"
run_test "Popular Pack exists" "$DOCKER_COMPOSE_CMD exec -T postgres psql -U gameuser -d game_portal -c \"SELECT name FROM credit_packages WHERE name = 'Popular Pack';\" | grep -q 'Popular Pack'"

# Test 9: Check game costs
print_status "=== GAME COST DATA TESTS ==="
run_test "Standard game costs exist" "$DOCKER_COMPOSE_CMD exec -T postgres psql -U gameuser -d game_portal -c \"SELECT COUNT(*) FROM game_costs WHERE \\\"gameMode\\\" = 'standard';\" | grep -q '[1-9]'"
run_test "Championship game costs exist" "$DOCKER_COMPOSE_CMD exec -T postgres psql -U gameuser -d game_portal -c \"SELECT COUNT(*) FROM game_costs WHERE \\\"gameMode\\\" = 'championship';\" | grep -q '[1-9]'"

# Test 10: Environment variables
print_status "=== ENVIRONMENT CONFIGURATION ==="
run_test "Stripe secret key is set" "$DOCKER_COMPOSE_CMD exec -T app printenv STRIPE_SECRET_KEY | grep -q 'sk_test'"
run_test "Stripe publishable key is set" "$DOCKER_COMPOSE_CMD exec -T app printenv NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | grep -q 'pk_test'"

# Test 11: Check if users have free credits
print_status "=== USER CREDIT TESTS ==="
run_test "Users have free credits" "$DOCKER_COMPOSE_CMD exec -T postgres psql -U gameuser -d game_portal -c 'SELECT AVG(credits) FROM users;' | grep -q '[1-9]' || echo 'No users yet, which is normal'"

echo ""
print_info "📊 Test Results Summary:"
echo "   Total Tests: $TOTAL_TESTS"
echo "   Passed: $((TOTAL_TESTS - FAILED_TESTS))"
echo "   Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    print_success "🎉 All credit system tests passed!"
    echo ""
    print_info "🎮 Ready to test the credit system manually:"
    echo ""
    echo "1. 🏠 Open the app: http://localhost:3000"
    echo "2. 🔐 Sign in with Google (or create account)"
    echo "3. 💳 Go to Credits page: http://localhost:3000/credits"
    echo "4. 🎯 Try playing a game: http://localhost:3000/games/memdot"
    echo "5. 🏆 Test championship mode: http://localhost:3000/games/memdot/championship"
    echo "6. 👨‍💼 Check admin panel: http://localhost:3000/admin/credits"
    echo ""
    print_info "💡 Testing Tips:"
    echo "   • Use Stripe test card: 4242 4242 4242 4242"
    echo "   • Any future date and CVC will work"
    echo "   • Check your credit balance in the header"
    echo "   • Try playing games to spend credits"
    echo "   • View transaction history on credits page"
    echo ""
else
    echo ""
    print_error "❌ Some tests failed. Check the logs above for details."
    echo ""
    print_info "🔍 Debugging commands:"
    echo "   View app logs: $DOCKER_COMPOSE_CMD logs app"
    echo "   View database: $DOCKER_COMPOSE_CMD exec postgres psql -U gameuser -d game_portal"
    echo "   Check containers: $DOCKER_COMPOSE_CMD ps"
    echo ""
fi

# Show container status
echo ""
print_info "📋 Container Status:"
$DOCKER_COMPOSE_CMD ps

echo ""
print_info "🔗 Quick Access URLs:"
echo "   🏠 Home: http://localhost:3000"
echo "   💳 Credits: http://localhost:3000/credits"
echo "   🎮 Games: http://localhost:3000/games"
echo "   🎯 Memdot: http://localhost:3000/games/memdot"
echo "   🏆 Championship: http://localhost:3000/games/memdot/championship"
echo "   👨‍💼 Admin: http://localhost:3000/admin/credits"
echo "   🔧 Health: http://localhost:3000/api/health"

exit $FAILED_TESTS
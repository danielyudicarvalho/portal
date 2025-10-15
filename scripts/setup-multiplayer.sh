#!/bin/bash

# Multiplayer Framework Setup Script
echo "🎮 Setting up Multiplayer Framework..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

# Check if Redis is available (optional)
if command -v redis-cli &> /dev/null; then
    echo "✅ Redis found - will be used for presence and scaling"
    redis-cli ping > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis is installed but not running. Starting Redis is recommended for production."
    fi
else
    echo "⚠️  Redis not found - using in-memory presence (single server only)"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p server/rooms
mkdir -p server/schemas
mkdir -p public/js
mkdir -p logs

# Set up environment file if it doesn't exist
if [ ! -f .env.multiplayer ]; then
    echo "⚙️  Creating environment configuration..."
    cat > .env.multiplayer << EOL
# Multiplayer Server Configuration
MULTIPLAYER_PORT=3002
NODE_ENV=development

# Redis Configuration (optional)
# REDIS_URL=redis://localhost:6379

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Security
# JWT_SECRET=your-jwt-secret-here

# Monitoring
ENABLE_MONITORING=true
LOG_LEVEL=info
EOL
    echo "✅ Created .env.multiplayer - please review and customize as needed"
fi

# Check if ports are available
echo "🔍 Checking port availability..."
if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3002 is already in use. Please stop the service or change MULTIPLAYER_PORT in .env.multiplayer"
else
    echo "✅ Port 3002 is available"
fi

# Test the server
echo "🧪 Testing server startup..."
timeout 10s npm run dev:multiplayer > /dev/null 2>&1 &
SERVER_PID=$!
sleep 3

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Multiplayer server started successfully"
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null
else
    echo "❌ Server failed to start. Check the logs for errors."
    exit 1
fi

echo ""
echo "🎉 Multiplayer Framework setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review .env.multiplayer configuration"
echo "2. Start the development server: npm run dev:multiplayer"
echo "3. Open http://localhost:3002/health to verify server is running"
echo "4. Check the example games in public/games/snake-multiplayer-v2/"
echo ""
echo "🚀 Quick start commands:"
echo "  npm run dev:full          # Start Next.js + Multiplayer server"
echo "  npm run dev:multiplayer   # Start only multiplayer server"
echo ""
echo "📚 Documentation:"
echo "  - Framework Guide: MULTIPLAYER_FRAMEWORK_GUIDE.md"
echo "  - API Reference: http://localhost:3002/games"
echo "  - Monitor: http://localhost:3002/colyseus"
echo ""
echo "🐛 Troubleshooting:"
echo "  - Check server logs in the console"
echo "  - Verify WebSocket connections in browser dev tools"
echo "  - Ensure firewall allows port 3002"
echo ""
echo "Happy multiplayer gaming! 🎮"
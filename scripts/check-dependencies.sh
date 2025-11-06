#!/bin/bash

echo "🔍 Checking testing dependencies..."

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ jq is not installed. Installing jq for JSON testing..."
    
    # Try to install jq based on the system
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y jq
    elif command -v yum &> /dev/null; then
        sudo yum install -y jq
    elif command -v brew &> /dev/null; then
        brew install jq
    else
        echo "⚠️  Please install jq manually: https://stedolan.github.io/jq/download/"
        echo "   On Ubuntu/Debian: sudo apt-get install jq"
        echo "   On CentOS/RHEL: sudo yum install jq"
        echo "   On macOS: brew install jq"
        exit 1
    fi
fi

echo "✅ jq is installed"

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo "❌ curl is not installed. Please install curl."
    exit 1
fi

echo "✅ curl is installed"

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker."
    exit 1
fi

echo "✅ Docker is installed"

# Check if docker compose is available
if docker compose version &> /dev/null; then
    echo "✅ Docker Compose (v2) is available"
elif command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose (v1) is available"
else
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

echo "🎉 All dependencies are ready for testing!"
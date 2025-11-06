#!/bin/sh

echo "🔄 Starting database migration..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until npx prisma db push --accept-data-loss 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# Run migrations
echo "🚀 Running Prisma migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "✅ Database migration completed successfully!"
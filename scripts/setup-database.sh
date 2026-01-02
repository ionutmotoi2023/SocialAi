#!/bin/bash

# Setup Database Script for Railway Deployment
# This script ensures the database is properly configured with seed data

set -e

echo "🚀 Setting up database for SocialAI..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set!"
  echo "   This script must be run on Railway with DATABASE_URL configured."
  exit 1
fi

echo "✅ DATABASE_URL is configured"
echo ""

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Push database schema
echo "🗄️  Pushing database schema..."
npx prisma db push --accept-data-loss

# Run seed script
echo "🌱 Seeding database with initial data..."
npx prisma db seed

echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "📧 Available Login Credentials:"
echo ""
echo "   🔑 SUPER ADMIN (Can manage all tenants)"
echo "      Email: superadmin@mindloop.ro"
echo "      Password: (any password in demo mode)"
echo ""
echo "   👤 TENANT ADMIN (AI MINDLOOP SRL)"
echo "      Email: admin@mindloop.ro"
echo "      Password: (any password in demo mode)"
echo ""
echo "   ✏️  EDITOR (AI MINDLOOP SRL)"
echo "      Email: editor@mindloop.ro"
echo "      Password: (any password in demo mode)"
echo ""

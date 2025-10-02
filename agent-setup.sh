#!/bin/bash

# Coffee Shop Agent Setup Script
# This script sets up the entire application in one go for automated deployment

echo "🚀 Starting Coffee Shop automated setup..."

# Step 1: Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Step 2: Create environment file
echo "⚙️  Creating environment configuration..."
if [ -z "$JWT_SECRET" ]; then
  echo "❌ JWT_SECRET environment variable is not set. Please set it before running this script."
  exit 1
fi
cat > .env.local << EOF
DATABASE_URL=postgresql://admin:password@localhost:5432/coffee_shop
JWT_SECRET=$JWT_SECRET
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# Step 3: Start database
echo "🐘 Starting PostgreSQL database..."
docker compose up -d

# Step 4: Wait for database initialization
echo "⏳ Waiting for database to initialize (10 seconds)..."
sleep 10

# Step 5: Verify database setup
echo "✅ Verifying database setup..."
docker exec coffee-shop-db psql -U admin -d coffee_shop -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database initialized successfully"
else
    echo "❌ Database initialization failed"
    exit 1
fi

# Step 6: Start application
echo "🌐 Starting Next.js application..."
echo "📍 Application will be available at:"
echo "   - Primary:  http://localhost:3000"
echo "   - Fallback: http://localhost:3001 (if port 3000 is occupied)"
echo ""
echo "👤 Default admin credentials:"
echo "   Email: admin@coffeeshop.com"
echo "   Password: admin123"
echo ""
echo "🎯 To test the setup, run these commands in a new terminal:"
echo "   curl -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{\"email\": \"admin@coffeeshop.com\", \"password\": \"admin123\"}'"
echo "   curl http://localhost:3000/api/products"
echo ""
echo "🚀 Starting development server..."

npm run dev

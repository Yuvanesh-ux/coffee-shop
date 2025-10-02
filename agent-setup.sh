#!/bin/bash

# Coffee Shop Agent Setup Script
# This script sets up the entire application in one go for automated deployment

echo "🚀 Starting Coffee Shop automated setup..."

# Step 1: Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Step 2: Create environment file
echo "⚙️  Creating environment configuration..."
# Support non-interactive setup for CI/CD by reading from environment variables if set
if [ -z "$DB_USER" ]; then
  read -p "Enter PostgreSQL username: " DB_USER
fi
if [ -z "$DB_PASS" ]; then
  read -s -p "Enter PostgreSQL password: " DB_PASS
  echo
fi
if [ -z "$DB_HOST" ]; then
  read -p "Enter PostgreSQL host [localhost]: " DB_HOST
  DB_HOST=${DB_HOST:-localhost}
fi
if [ -z "$DB_PORT" ]; then
  read -p "Enter PostgreSQL port [5432]: " DB_PORT
  DB_PORT=${DB_PORT:-5432}
fi
if [ -z "$DB_NAME" ]; then
  read -p "Enter PostgreSQL database name [coffee_shop]: " DB_NAME
  DB_NAME=${DB_NAME:-coffee_shop}
fi
if [ -z "$JWT_SECRET" ]; then
  read -p "Enter JWT secret (required): " JWT_SECRET
  if [ -z "$JWT_SECRET" ]; then
    echo "JWT secret is required. Exiting."
    exit 1
  fi
fi
if [ -z "$APP_URL" ]; then
  read -p "Enter public app URL [http://localhost:3000]: " APP_URL
  APP_URL=${APP_URL:-http://localhost:3000}
fi

cat > .env.local << EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME
JWT_SECRET=$JWT_SECRET
NEXT_PUBLIC_APP_URL=$APP_URL
EOF

# Step 3: Start database
echo "🐘 Starting PostgreSQL database..."
docker compose up -d

# Step 4: Wait for database initialization
echo "⏳ Waiting for database to initialize (10 seconds)..."
sleep 10

# Step 5: Verify database
echo "✅ Verifying database setup..."
docker exec coffee-shop-db psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database initialized successfully"
else
    echo "❌ Database initialization failed"
    exit 1
fi

# Step 6: Start application
echo "🌐 Starting Next.js application..."
echo "📍 Application will be available at:"
echo "   - Primary:  $APP_URL"
echo "   - Fallback: http://localhost:3001 (if port 3000 is occupied)"
echo ""
echo "👤 Default admin credentials:"
echo "   Email: admin@coffeeshop.com"
echo "   Password: admin123"
echo ""
echo "🎯 To test the setup, run these commands in a new terminal:"
echo "   curl -X POST $APP_URL/api/auth/login -H 'Content-Type: application/json' -d '{\"email\": \"admin@coffeeshop.com\", \"password\": \"admin123\"}'"
echo "   curl $APP_URL/api/products"
echo ""
echo "🚀 Starting development server..."

npm run dev

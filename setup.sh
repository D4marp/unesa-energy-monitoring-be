#!/bin/bash

# Smart Energy Dashboard - Setup Script

echo "🚀 Smart Energy Dashboard - Backend Setup"
echo "=========================================="
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the backend directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully"
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=smart_energy_dashboard
DB_PORT=3030

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d

# API Configuration
FRONTEND_URL=http://localhost:3001
API_PREFIX=/api/v1
EOF
    echo "✅ .env file created"
    echo "   Please update the database credentials if needed"
else
    echo "⏭️  .env file already exists (skipping)"
fi

echo ""
echo "=========================================="
echo "✅ Setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Update .env with your database credentials"
echo "2. Create database: mysql -u root -p"
echo "3. Run this command in MySQL:"
echo "   source database/schema.sql"
echo "4. Start the server: npm run dev"
echo ""
echo "API will be available at: http://localhost:5000/api/v1"
echo "=========================================="

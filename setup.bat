@echo off
REM Smart Energy Dashboard - Setup Script for Windows

echo.
echo 🚀 Smart Energy Dashboard - Backend Setup
echo ==========================================
echo.

REM Check if we're in the correct directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the backend directory.
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully
echo.

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo ⚙️  Creating .env file...
    (
        echo # Database Configuration
        echo DB_HOST=localhost
        echo DB_USER=root
        echo DB_PASSWORD=
        echo DB_NAME=smart_energy_dashboard
        echo DB_PORT=3030
        echo.
        echo # Server Configuration
        echo PORT=5000
        echo NODE_ENV=development
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=your_jwt_secret_key_change_this_in_production
        echo JWT_EXPIRE=7d
        echo.
        echo # API Configuration
        echo FRONTEND_URL=http://localhost:3001
        echo API_PREFIX=/api/v1
    ) > .env
    echo ✅ .env file created
    echo    Please update the database credentials if needed
) else (
    echo ⏭️  .env file already exists (skipping)
)

echo.
echo ==========================================
echo ✅ Setup completed!
echo.
echo 📝 Next steps:
echo 1. Update .env with your database credentials
echo 2. Create database: mysql -u root -p
echo 3. Run this command in MySQL:
echo    source database/schema.sql
echo 4. Start the server: npm run dev
echo.
echo API will be available at: http://localhost:5000/api/v1
echo ==========================================
echo.

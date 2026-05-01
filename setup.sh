#!/bin/bash
# setup.sh - One-command setup script for ChatWave

set -e

echo "🚀 Setting up ChatWave..."

# Backend
echo "\n📦 Installing backend dependencies..."
cd backend
npm install
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created backend/.env — please edit it with your MongoDB URI and JWT secret"
fi

# Frontend
echo "\n📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo "\n✅ Setup complete!"
echo "\n📋 Next steps:"
echo "  1. Edit backend/.env with your settings"
echo "  2. Terminal 1: cd backend && npm run dev"
echo "  3. Terminal 2: cd frontend && npm start"
echo "  4. Open http://localhost:3000"

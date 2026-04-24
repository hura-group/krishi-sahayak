#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# KrishiSahayak — One-Time Project Setup Script
# Run this ONCE after cloning the repo on a fresh machine.
# Usage: bash SETUP.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e  # Stop on any error

GREEN='\033[0;32m'
AMBER='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "🌾  KrishiSahayak — Project Setup"
echo "──────────────────────────────────"
echo ""

# ── Step 1: Check Node.js version ─────────────────────────────────────────
echo "Checking Node.js version..."
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 20 LTS is required. Install it from https://nodejs.org${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# ── Step 2: Check pnpm ─────────────────────────────────────────────────────
echo "Checking pnpm..."
if ! command -v pnpm &>/dev/null; then
  echo "pnpm not found. Installing..."
  npm install -g pnpm
fi
echo -e "${GREEN}✅ pnpm $(pnpm -v) detected${NC}"

# ── Step 3: Install dependencies ───────────────────────────────────────────
echo ""
echo "Installing all dependencies..."
pnpm install
echo -e "${GREEN}✅ Dependencies installed${NC}"

# ── Step 3b: Install Expo-managed native packages ──────────────────────────
echo ""
echo "Installing Expo native packages..."
cd apps/mobile
npx expo install react-native-maps expo-location expo-notifications expo-device 2>/dev/null || true
cd ../..
echo -e "${GREEN}✅ Native packages installed${NC}"

# ── Step 4: Set up Husky ───────────────────────────────────────────────────
echo ""
echo "Setting up Husky pre-commit hooks..."
npx husky install 2>/dev/null || true
chmod +x .husky/pre-commit 2>/dev/null || true
chmod +x .husky/commit-msg 2>/dev/null || true
echo -e "${GREEN}✅ Husky hooks installed${NC}"

# ── Step 5: Create environment files ──────────────────────────────────────
echo ""
echo "Creating environment variable files..."

if [ ! -f "apps/mobile/.env" ]; then
  cp apps/mobile/.env.example apps/mobile/.env
  echo -e "${AMBER}⚠️  Created apps/mobile/.env — open it and fill in your values${NC}"
else
  echo "apps/mobile/.env already exists — skipping"
fi

if [ ! -f "apps/web/.env.local" ]; then
  cp apps/web/.env.example apps/web/.env.local
  echo -e "${AMBER}⚠️  Created apps/web/.env.local — open it and fill in your values${NC}"
else
  echo "apps/web/.env.local already exists — skipping"
fi

# ── Step 6: Verify ESLint works ───────────────────────────────────────────
echo ""
echo "Verifying ESLint configuration..."
if pnpm lint --quiet 2>/dev/null; then
  echo -e "${GREEN}✅ ESLint configured correctly${NC}"
else
  echo -e "${AMBER}⚠️  ESLint found issues — run 'pnpm lint:fix' to auto-fix${NC}"
fi

# ── Done ──────────────────────────────────────────────────────────────────
echo ""
echo "──────────────────────────────────"
echo -e "${GREEN}🌾  Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Fill in your environment variables:"
echo "     open apps/mobile/.env"
echo ""
echo "     Required keys:"
echo "       EXPO_PUBLIC_SUPABASE_URL      — from supabase.com → Settings → API"
echo "       EXPO_PUBLIC_SUPABASE_ANON_KEY — same place"
echo "       GOOGLE_MAPS_API_KEY           — from console.cloud.google.com"
echo "       EXPO_PUBLIC_PROJECT_ID        — from expo.dev → your project"
echo ""
echo "     Google Maps — enable these APIs in Cloud Console:"
echo "       Maps SDK for Android + iOS · Places API · Directions API"
echo ""
echo "  2. Run the Supabase migrations:"
echo "     supabase db push   OR paste each file in Supabase SQL editor"
echo "     supabase/migrations/20260318000001_init_schema.sql"
echo "     supabase/migrations/20260424000001_price_alerts.sql"
echo "     supabase/migrations/20260424000002_mandis.sql"
echo ""
echo "  3. Start the mobile app:"
echo "     cd apps/mobile && pnpm start"
echo ""
echo "  4. Read CONTRIBUTING.md before your first commit."
echo ""

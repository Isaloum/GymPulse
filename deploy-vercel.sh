#!/bin/bash

# 🚀 GymPulse → Vercel Deployment Script
# This script automates the deployment to Vercel

set -e  # Exit on error

echo "================================================"
echo "🚀 GymPulse Vercel Deployment"
echo "================================================"
echo ""

# Step 1: Verify git is ready
echo "✓ Checking git status..."
cd /Users/ihabsaloum/Desktop/GymPulse
git status > /dev/null 2>&1 || (echo "❌ Git not initialized. Run: git init" && exit 1)

# Step 2: Verify build
echo "✓ Building production bundle..."
npm run build > /dev/null 2>&1

# Step 3: Add to git
echo "✓ Staging files for git..."
git add .
git commit -m "Initial commit: GymPulse v1.0.0 production-ready" || echo "  (Already committed)"

# Step 4: Instructions for GitHub
echo ""
echo "================================================"
echo "📋 NEXT STEPS - Complete these in your browser:"
echo "================================================"
echo ""
echo "1️⃣  CREATE GITHUB REPO:"
echo "   → Go to https://github.com/new"
echo "   → Repository name: gym-pulse"
echo "   → Click 'Create repository'"
echo ""
echo "2️⃣  PUSH CODE TO GITHUB:"
echo "   Copy & paste these commands (replace YOUR-USERNAME):"
echo ""
echo "   git remote add origin https://github.com/YOUR-USERNAME/gym-pulse.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3️⃣  DEPLOY TO VERCEL:"
echo "   → Go to https://vercel.com"
echo "   → Sign in with GitHub"
echo "   → Click 'New Project' → Select 'gym-pulse'"
echo "   → Click 'Import' → 'Deploy'"
echo ""
echo "4️⃣  GET YOUR LIVE URL:"
echo "   → Vercel gives you a link like:"
echo "   → https://gym-pulse.vercel.app"
echo "   → Share this URL with anyone!"
echo ""
echo "================================================"
echo "💡 Pro Tip: Every git push auto-deploys to Vercel"
echo "================================================"

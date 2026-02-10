# 🚀 GymPulse Deployment Guide

Get GymPulse live in 2-5 minutes. Choose your platform below.

---

## 🎯 Quick Links

- **Landing Page**: Open `landing.html` locally to see the marketing site
- **Live App**: See deployment options below
- **GitHub**: [Create a repo and push this code](https://github.com/new)

---

## Option 1: Vercel (Recommended — 2 minutes, auto-updates)

Vercel automatically deploys your app whenever you push to GitHub.

### Setup Steps

1. **Create a GitHub account** (if you don't have one)
   - Go to [github.com](https://github.com)
   - Sign up (free)

2. **Create a GitHub repo**
   - Click **"+"** → **"New repository"**
   - Name: `gym-pulse` (or your choice)
   - Click **"Create repository"**

3. **Push GymPulse code to GitHub**
   ```bash
   cd /Users/ihabsaloum/Desktop/GymPulse
   
   # Initialize git (first time only)
   git init
   git add .
   git commit -m "Initial commit: GymPulse production-ready"
   
   # Connect to your GitHub repo
   git remote add origin https://github.com/YOUR-USERNAME/gym-pulse.git
   git branch -M main
   git push -u origin main
   ```
   *(Replace `YOUR-USERNAME` with your actual GitHub username)*

4. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click **"Sign up"** → Sign in with GitHub
   - Click **"New Project"** → Select your `gym-pulse` repo
   - Click **"Import"** → **"Deploy"**

5. **Get your live URL** 
   - Vercel gives you a link like: `https://gym-pulse.vercel.app`
   - Share this link with anyone to view your app!

📌 **Bonus**: Every time you push code to GitHub, Vercel auto-deploys. No extra steps needed.

---

## Option 2: Netlify (Easiest — 1 minute, no GitHub needed)

Deploy without any GitHub setup.

### Setup Steps

1. **Build the app**
   ```bash
   cd /Users/ihabsaloum/Desktop/GymPulse
   npm run build
   ```
   *(This creates a `dist` folder)*

2. **Go to Netlify**
   - Visit [netlify.com](https://netlify.com)
   - Click **"Sign up"** (email is fine)

3. **Drag & drop deployment**
   - Look for **"Sites"** section
   - Drag the entire `dist` folder onto Netlify
   - That's it! You get a live URL instantly

4. **Share your URL**
   - You'll get something like: `https://silly-name-12345.netlify.app`
   - Customize the name in **Site settings**

---

## Option 3: GitHub Pages (Free, Good for Portfolios)

Deploy like a pro using Git.

### Setup Steps

1. **Create a GitHub repo**
   - Go to [github.com/new](https://github.com/new)
   - Create a public repo named `gym-pulse`

2. **Push code to GitHub**
   ```bash
   cd /Users/ihabsaloum/Desktop/GymPulse
   
   git init
   git add .
   git commit -m "GymPulse initial commit"
   git remote add origin https://github.com/YOUR-USERNAME/gym-pulse.git
   git branch -M main
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to your repo → **Settings** → **Pages**
   - Under "Source", select: **Deploy from a branch**
   - Select: **main** branch, **/root** folder
   - Click **Save**

4. **Build and deploy**
   ```bash
   npm run build
   git add dist
   git commit -m "Deploy dist"
   git push
   ```

5. **Get your URL**
   - Your site is live at: `https://YOUR-USERNAME.github.io/gym-pulse`

---

## Option 4: Docker + Any Server

Deploy to your own server.

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=0 /app/dist ./dist
CMD ["serve", "-s", "dist", "-l", "3000"]
EXPOSE 3000
```

```bash
# Build and run
docker build -t gym-pulse .
docker run -p 3000:8080 gym-pulse
```

---

## Recommended: Vercel + GitHub (Best Practice)

```bash
# 1. One-time setup
cd /Users/ihabsaloum/Desktop/GymPulse
git init
git add .
git commit -m "Init: GymPulse v1.0.0"
git remote add origin https://github.com/YOUR-USERNAME/gym-pulse.git
git push -u origin main

# 2. Connect Vercel to GitHub via UI (takes 1 minute)
# Visit vercel.com → Import from GitHub

# 3. Every time you update code:
git add .
git commit -m "Update: [your changes]"
git push

# Vercel auto-deploys! No more steps needed.
```

---

## Environment Variables (Optional)

If you ever need to add API keys or config, add them to Vercel:

1. **Vercel Dashboard** → Your project → **Settings** → **Environment Variables**
2. Add your variables (e.g., `REACT_APP_API_KEY`)
3. Redeploy

Example in your code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

---

## Domain Setup (Optional)

### Add a custom domain (e.g., `gympulse.com`)

**Vercel:**
- Settings → Domains → Add your domain
- Update DNS at your registrar (GoDaddy, Namecheap, etc.)

**Netlify:**
- Site settings → Domain management → Add custom domain

---

## Troubleshooting

### "npm not found"
```bash
# Install Node.js from https://nodejs.org
node --version  # Should be 18+
npm --version   # Should be 9+
```

### "dist folder not found"
```bash
npm run build  # Creates dist/ folder
```

### "Deployment failed"
- Check build logs on Vercel/Netlify dashboard
- Ensure `package.json` has all dependencies
- Run locally first: `npm run build && npm run preview`

### "App blank on live site"
- Check browser console (F12) for errors
- Clear cache: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Check if build command is correct: `npm run build`

---

## What's Next?

Once live:

1. **Share the URL** with friends/colleagues
2. **Add real data** by replacing mock API calls
3. **Add authentication** for member-only features
4. **Monitor performance** with Vercel Analytics
5. **Set up CI/CD** for automated testing/deployment

---

## Live Example URL

Once deployed, your URL will look like:

- **Vercel**: `https://gym-pulse.vercel.app`
- **Netlify**: `https://gym-pulse.netlify.app`
- **GitHub Pages**: `https://username.github.io/gym-pulse`
- **Custom Domain**: `https://gympulse.com`

---

## Still Having Issues?

1. Run tests locally: `npm test`
2. Check build: `npm run build`
3. Preview locally: `npm run preview`
4. Check the [main README.md](./README.md) for more details

---

**You got this!** Deploy in the next 2 minutes. 🚀
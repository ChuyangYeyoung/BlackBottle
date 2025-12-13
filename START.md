# How to Run Black Bottle

## Prerequisites Issue ⚠️

Node.js v22 is required but not currently in your PATH. Here's how to fix this:

## Option 1: Using Homebrew (Recommended)

```bash
# Install Node.js v22
brew install node@22

# Add to PATH
echo 'export PATH="/opt/homebrew/opt/node@22/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify installation
node --version  # Should show v22.x.x
```

## Option 2: Using NVM (Node Version Manager)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.zshrc  # or source ~/.bashrc

# Install Node.js v22
nvm install 22
nvm use 22

# Verify
node --version
```

## After Node.js is Installed

### 1. Start the Local API Server

```bash
cd /Users/young/code/DB_final_project/v4-web/local-api
npm install
npm start
```

This will start the API on http://localhost:3001

### 2. Start the Main Web App (in a new terminal)

```bash
cd /Users/young/code/DB_final_project/v4-web
pnpm install  # If dependencies aren't installed
pnpm dev
```

This will start the app, typically on http://localhost:5173

## Quick Start Script

Once Node.js is set up, you can use this script:

```bash
#!/bin/bash
# Save this as: start-black-bottle.sh

# Start local API in background
cd /Users/young/code/DB_final_project/v4-web/local-api
npm start &

# Wait for API to start
sleep 3

# Start main app
cd /Users/young/code/DB_final_project/v4-web
pnpm dev
```

Make it executable:
```bash
chmod +x start-black-bottle.sh
./start-black-bottle.sh
```

## Troubleshooting

### If you see "command not found: node"
- Make sure Node.js v22 is installed
- Restart your terminal after installation
- Check PATH: `echo $PATH`

### If you see "command not found: pnpm"
```bash
npm install -g pnpm
```

### Port Already in Use
If port 3001 or 5173 is in use:
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

## What You'll See

Once running:
- **Local API**: http://localhost:3001
  - Health check: http://localhost:3001/health

- **Black Bottle Web App**: http://localhost:5173
  - Modern white technology interface
  - Clean, minimal design
  - Blue accent colors (#3b82f6)

## Features to Test

1. **White Technology Theme** - Clean white backgrounds with subtle grays
2. **Modern Interface** - Blue accent colors, high contrast text
3. **Local Database** - Offline data storage system
4. **Trading Interface** - Full trading capabilities

Enjoy your Black Bottle platform! 🚀

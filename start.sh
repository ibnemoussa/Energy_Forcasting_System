#!/bin/bash
# =============================================================
# AI Energy Forecasting System — macOS Startup Script
# Run from the project root:  bash start.sh
#
# On first run this script will:
#   • Create the ML_2 conda environment (Python 3.12) if missing
#   • Install all Python dependencies from backend/requirements.txt
#   • Install all Node.js dependencies (npm install)
# Subsequent runs skip installation and launch immediately.
# =============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
CONDA_ENV="ML_2"
REQUIREMENTS="$BACKEND_DIR/requirements.txt"

echo ""
echo "============================================"
echo "  AI Energy Forecasting System"
echo "============================================"
echo ""

# ---------- locate conda ----------
CONDA_BASE=$(conda info --base 2>/dev/null || true)
if [ -z "$CONDA_BASE" ]; then
  for p in "$HOME/miniconda3" "$HOME/anaconda3" "/opt/homebrew/Caskroom/miniconda/base" "/usr/local/miniconda3" "/opt/miniconda3"; do
    if [ -d "$p" ]; then CONDA_BASE="$p"; break; fi
  done
fi

if [ -z "$CONDA_BASE" ]; then
  echo "❌  Conda not found."
  echo "    Install Miniconda from: https://docs.conda.io/en/latest/miniconda.html"
  echo "    Then re-run this script."
  exit 1
fi

echo "✔  Conda found at: $CONDA_BASE"

# ---------- source conda so we can use 'conda' commands ----------
source "$CONDA_BASE/etc/profile.d/conda.sh"

PYTHON="$CONDA_BASE/envs/$CONDA_ENV/bin/python"
PIP="$CONDA_BASE/envs/$CONDA_ENV/bin/pip"

# ---------- create conda env if missing ----------
if [ ! -f "$PYTHON" ]; then
  echo ""
  echo "📦  Conda environment '$CONDA_ENV' not found. Creating it now (Python 3.12)..."
  conda create -n "$CONDA_ENV" python=3.12 -y
  echo "✔  Environment '$CONDA_ENV' created."
fi

# ---------- install / update Python dependencies ----------
echo ""
echo "📦  Installing Python dependencies from requirements.txt..."
"$PIP" install -r "$REQUIREMENTS" --quiet
echo "✔  Python dependencies ready."

# ---------- node check ----------
if ! command -v node &>/dev/null; then
  echo ""
  echo "❌  Node.js not found."
  echo "    Install it from https://nodejs.org  or via Homebrew:  brew install node"
  exit 1
fi

echo "✔  Node.js $(node --version) found."

# ---------- install frontend dependencies ----------
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo ""
  echo "📦  Installing frontend dependencies (npm install)..."
  cd "$FRONTEND_DIR" && npm install --silent
  echo "✔  Frontend dependencies ready."
else
  echo "✔  Frontend dependencies already installed."
fi

echo ""
echo "🚀  Launching servers..."
echo ""

# ---------- launch backend in a new Terminal window ----------
osascript <<EOF
tell application "Terminal"
  set backendWin to do script "echo '🔋 Backend starting...' && cd '$BACKEND_DIR' && '$PYTHON' manage.py runserver"
  set custom title of backendWin to "AI Energy — Backend"
end tell
EOF

# give Django a moment to start
sleep 2

# ---------- launch frontend in a new Terminal window ----------
osascript <<EOF
tell application "Terminal"
  set frontendWin to do script "echo '⚡ Frontend starting...' && cd '$FRONTEND_DIR' && npm run dev"
  set custom title of frontendWin to "AI Energy — Frontend"
end tell
EOF

echo "✅  System starting up:"
echo "   Backend  →  http://localhost:8000"
echo "   Frontend →  http://localhost:5173"
echo ""
echo "   Two Terminal windows have been opened."
echo "   Close them to stop the servers."
echo ""

# open browser after a short delay
sleep 3
open "http://localhost:5173"

#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR/backend"

if [ -f "$DIR/.venv/bin/uvicorn" ]; then
    UVICORN_BIN="$DIR/.venv/bin/uvicorn"
else
    UVICORN_BIN="uvicorn"
fi

echo "=== Starting Vibe Voice Agent FastAPI Backend (Port 8000) ==="
"$UVICORN_BIN" main:app --host 0.0.0.0 --port 8000 --reload

#!/bin/bash
# =============================================================================
# uvicorn / Vite / ngrok をバックグラウンドで起動する
# devcontainer.json の "postStartCommand" から呼び出される。
# コンテナ起動のたびに実行される。
# =============================================================================

set -e

# postStartCommand は非対話シェルで実行されるため NVM が未読込の可能性あり。
# Node.js feature の npm を確実に利用するために PATH を明示的に設定する。
if [ -d "/usr/local/share/nvm" ]; then
  export NVM_DIR="/usr/local/share/nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi
export PATH="/usr/local/share/nvm/current/bin:${PATH:-/usr/bin:/bin}"

cd /workspace

# Git safe.directory: リビルド時の dubious ownership 対策（確実に適用されるよう毎回チェック）
mkdir -p /home/cursor/.config/git
GIT_CFG="/home/cursor/.config/git/config"
if [ ! -f "$GIT_CFG" ] || ! grep -q 'safe.directory.*/workspace' "$GIT_CFG" 2>/dev/null; then
  git config --file "$GIT_CFG" --add safe.directory /workspace 2>/dev/null || true
  chown cursor:cursor "$GIT_CFG" 2>/dev/null || true
fi

echo "=== Starting backend and frontend ==="

# uvicorn: ポート 8000 が未使用なら起動
if ! curl -sf http://localhost:8000/health > /dev/null 2>&1; then
  nohup uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 \
    >> /tmp/uvicorn.log 2>&1 &
  disown
  echo "  uvicorn started (port 8000)"
else
  echo "  uvicorn already running"
fi

# Vite: フロントエンドディレクトリが存在し、ポート 5173 が未使用なら起動
if [ -d "/workspace/frontend" ] && [ -f "/workspace/frontend/package.json" ]; then
  if ! curl -sf http://localhost:5173 > /dev/null 2>&1; then
    # npx vite を直接使用（npm run dev より環境依存が少ない）
    # setsid で新セッションとして起動し、親プロセス終了の影響を受けないようにする
    (
      cd /workspace/frontend
      setsid bash -c 'exec npx vite --host >> /tmp/vite.log 2>&1' &
    )
    disown 2>/dev/null || true
    # 起動完了を待機（最大 15 秒）
    for _ in $(seq 1 15); do
      sleep 1
      if curl -sf http://localhost:5173 > /dev/null 2>&1; then
        echo "  Vite started (port 5173)"
        break
      fi
    done
    if ! curl -sf http://localhost:5173 > /dev/null 2>&1; then
      echo "  Vite start may have failed - check /tmp/vite.log"
    fi
  else
    echo "  Vite already running"
  fi
fi

# ngrok: .env に NGROK_AUTH_TOKEN があり、ngrok が未起動ならトンネルを起動
if [ -f "/workspace/.env" ] && grep -q '^NGROK_AUTH_TOKEN=.' /workspace/.env 2>/dev/null; then
  if command -v ngrok > /dev/null 2>&1; then
    if ! curl -sf http://127.0.0.1:4040/api/tunnels > /dev/null 2>&1; then
      nohup ngrok http 8000 >> /tmp/ngrok.log 2>&1 &
      disown
      sleep 2
      if curl -sf http://127.0.0.1:4040/api/tunnels > /dev/null 2>&1; then
        echo "  ngrok started (tunnel to :8000)"
      else
        echo "  ngrok start may have failed - check /tmp/ngrok.log"
      fi
    else
      echo "  ngrok already running"
    fi
  fi
fi

echo "=== Services ready ==="
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  Logs:     tail -f /tmp/uvicorn.log /tmp/vite.log /tmp/ngrok.log"

#!/bin/bash
# =============================================================================
# Webhook Analyzer - コンテナ初回セットアップスクリプト
# =============================================================================
# devcontainer.json の "postCreateCommand" から呼び出される。
# コンテナが初めて作成されたときに1回だけ実行される。
# (リビルドすると再実行される)
#
# 処理内容:
#   1. Python パッケージの最新化 (requirements.txt)
#   2. フロントエンド依存のインストール (npm install)
#   3. Ollama の起動待ち & デフォルトモデルのダウンロード
# =============================================================================

# エラーが発生したら即座にスクリプトを停止
set -e

echo "=== Setting up Webhook Analyzer ==="

cd /workspace

# ---------------------------------------------------------------------------
# 0. Git safe.directory (リビルド時の dubious ownership 対策)
# ---------------------------------------------------------------------------
# /workspace はマウントのため所有者が cursor と一致せず Git がブロックする。
# post-create で cursor の config に追加し、リビルド後も自動で有効にする。
mkdir -p /home/cursor/.config/git
GIT_CONFIG=/home/cursor/.config/git/config
if ! grep -q 'safe.directory.*/workspace' "$GIT_CONFIG" 2>/dev/null; then
  git config --file "$GIT_CONFIG" --add safe.directory /workspace
fi
chown -R cursor:cursor /home/cursor/.config/git 2>/dev/null || true

# ---------------------------------------------------------------------------
# 1. Python パッケージのインストール
# ---------------------------------------------------------------------------
# Dockerfile でも事前インストールしているが、
# requirements.txt が更新されている場合に備えて再実行する。
pip install --no-cache-dir -r requirements.txt

# ---------------------------------------------------------------------------
# 2. データベースマイグレーション
# ---------------------------------------------------------------------------
if command -v alembic > /dev/null 2>&1; then
  echo "Running database migrations..."
  alembic upgrade head || echo "WARNING: Migration failed (DB might not be ready yet)"
fi

# ---------------------------------------------------------------------------
# 2.5. ngrok Authtoken ( .env の NGROK_AUTH_TOKEN から設定 )
# ---------------------------------------------------------------------------
if [ -f .env ] && command -v ngrok > /dev/null 2>&1; then
  if grep -q '^NGROK_AUTH_TOKEN=' .env 2>/dev/null; then
    NGROK_TOKEN=$(grep '^NGROK_AUTH_TOKEN=' .env | cut -d= -f2- | tr -d '"' | tr -d "'")
    if [ -n "$NGROK_TOKEN" ]; then
      ngrok config add-authtoken "$NGROK_TOKEN" 2>/dev/null || true
      echo "ngrok: authtoken configured from .env"
    fi
  fi
fi

# ---------------------------------------------------------------------------
# 3. フロントエンド依存パッケージのインストール
# ---------------------------------------------------------------------------
# frontend ディレクトリが存在し、package.json がある場合のみ実行。
# 初回はまだ frontend が無い場合があるのでチェックしている。
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  echo "Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

# ---------------------------------------------------------------------------
# 4. Ollama モデルのセットアップ
# ---------------------------------------------------------------------------
echo ""
echo "=== Pulling default Ollama model ==="

# Ollama サービスの起動を待機 (最大120秒)
# macOS (Docker Desktop) では Ollama の起動に時間がかかる場合がある
echo "Waiting for Ollama to be ready..."
OLLAMA_READY=false
for i in $(seq 1 60); do
  if curl -sf http://ollama:11434/api/tags > /dev/null 2>&1; then
    echo "Ollama is ready."
    OLLAMA_READY=true
    break
  fi
  sleep 2
done

if [ "$OLLAMA_READY" = false ]; then
  echo "WARNING: Ollama did not become ready within 120s."
  echo "  You can pull the model manually later:"
  echo "  curl http://ollama:11434/api/pull -d '{\"name\": \"gemma3:4b\"}'"
fi

OLLAMA_MODEL="${OLLAMA_MODEL:-gemma3:4b}"

if [ "$OLLAMA_READY" = true ]; then
  echo "Pulling model: ${OLLAMA_MODEL} ..."
  curl -sf http://ollama:11434/api/pull -d "{\"name\": \"${OLLAMA_MODEL}\"}" | while read -r line; do
    status=$(echo "$line" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null || true)
    [ -n "$status" ] && echo "  $status"
  done
  echo "Model ${OLLAMA_MODEL} is ready."
fi

# ---------------------------------------------------------------------------
# セットアップ完了メッセージ
# ---------------------------------------------------------------------------
GPU_STATUS="CPU mode"
if docker info 2>/dev/null | grep -qi "nvidia"; then
  GPU_STATUS="NVIDIA GPU detected"
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "  GPU:      ${GPU_STATUS}"
echo "  LLM:      Ollama (${OLLAMA_MODEL}) @ http://ollama:11434"
echo "  Backend:  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "  Switch LLM provider via env: LLM_PROVIDER=ollama|openai|anthropic"
echo ""
echo "  ngrok (外部 Webhook 受信用):"
echo "    .env に NGROK_AUTH_TOKEN があれば post-create で authtoken 設定済み"
echo "    コンテナ起動時に自動で ngrok http 8000 が起動します"

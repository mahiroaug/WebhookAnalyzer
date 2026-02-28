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
# 1. Python パッケージのインストール
# ---------------------------------------------------------------------------
# Dockerfile でも事前インストールしているが、
# requirements.txt が更新されている場合に備えて再実行する。
pip install --no-cache-dir -r requirements.txt

# ---------------------------------------------------------------------------
# 2. フロントエンド依存パッケージのインストール
# ---------------------------------------------------------------------------
# frontend ディレクトリが存在し、package.json がある場合のみ実行。
# 初回はまだ frontend が無い場合があるのでチェックしている。
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  echo "Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

# ---------------------------------------------------------------------------
# 3. Ollama モデルのセットアップ
# ---------------------------------------------------------------------------
echo ""
echo "=== Pulling default Ollama model ==="

# Ollama サービスの起動を待機 (最大60秒)
# docker-compose の depends_on + healthcheck で大抵は起動済みだが、
# 念のため追加で待機する。
echo "Waiting for Ollama to be ready..."
for i in $(seq 1 30); do
  if curl -sf http://ollama:11434/api/tags > /dev/null 2>&1; then
    echo "Ollama is ready."
    break
  fi
  # 2秒間隔でリトライ (30回 × 2秒 = 最大60秒)
  sleep 2
done

# 環境変数 OLLAMA_MODEL が未設定なら gemma3:4b をデフォルトで使用
# gemma3:4b は約3GBで、Webhook の JSON 分類には十分な性能。
# より高精度が必要なら gemma3:12b や qwen3:8b なども選択可能。
OLLAMA_MODEL="${OLLAMA_MODEL:-gemma3:4b}"
echo "Pulling model: ${OLLAMA_MODEL} ..."

# Ollama の /api/pull は NDJSON (改行区切り JSON) でダウンロード進捗を返す。
# 各行の "status" フィールドだけを抽出して表示する。
curl -sf http://ollama:11434/api/pull -d "{\"name\": \"${OLLAMA_MODEL}\"}" | while read -r line; do
  status=$(echo "$line" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null || true)
  [ -n "$status" ] && echo "  $status"
done
echo "Model ${OLLAMA_MODEL} is ready."

# ---------------------------------------------------------------------------
# セットアップ完了メッセージ
# ---------------------------------------------------------------------------
echo ""
echo "=== Setup complete ==="
echo ""
echo "  LLM:      Ollama (${OLLAMA_MODEL}) @ http://ollama:11434"
echo "  Backend:  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "  Switch LLM provider via env: LLM_PROVIDER=ollama|openai|anthropic"

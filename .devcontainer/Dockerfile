# =============================================================================
# Webhook Analyzer - 開発コンテナ Dockerfile
# =============================================================================
# このイメージは devcontainer の "app" サービスとして使用される。
# Microsoft 公式の devcontainer イメージをベースに、
# アプリケーションの依存パッケージを事前インストールする。
#
# ベースイメージに含まれるもの:
#   - Python 3.12 (pip, venv 含む)
#   - 一般的な開発ツール (gcc, make, etc.)
#   - vscode ユーザー (非 root)
#
# devcontainer features (devcontainer.json で定義) により追加されるもの:
#   - Node.js 20 LTS
#   - Docker CLI (Docker-in-Docker)
#   - Git
# =============================================================================

FROM mcr.microsoft.com/devcontainers/python:1-3.12-bullseye

# ---------------------------------------------------------------------------
# システムパッケージのインストール
# ---------------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    # psql コマンドで DB に直接接続・デバッグするために必要
    postgresql-client \
    # Ollama のヘルスチェックや API 呼び出しに使用
    curl \
    && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# Python パッケージの事前インストール
# ---------------------------------------------------------------------------
# イメージビルド時にインストールしておくことで、コンテナ作成が高速になる。
# requirements.txt が更新された場合は post-create.sh で再度 pip install される。
COPY requirements.txt /tmp/pip-tmp/
RUN pip install --no-cache-dir -r /tmp/pip-tmp/requirements.txt \
    && rm -rf /tmp/pip-tmp

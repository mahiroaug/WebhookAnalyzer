# Webhook Analyzer

外部サービスからの Webhook を受信し、**ローカル LLM で自動識別・分類**して、生 JSON を分類別に保管する分析ツール。  
[webhook.site](https://webhook.site) のローカル版 + AI 自動分類機能を目指しています。

## 主な機能

| 機能 | 説明 |
|------|------|
| Webhook 受信 | 任意の外部サービスからの HTTP リクエストを受け付ける汎用エンドポイント |
| AI 自動分類 | 受信したペイロードをローカル LLM (Ollama) で自動識別・カテゴリ分類 |
| 生 JSON 保管 | 受信データを分類別に PostgreSQL へ保管。jsonb 型で柔軟な検索が可能 |
| リアルタイム通知 | WebSocket で新着 Webhook をブラウザにリアルタイム配信 |
| マルチ LLM 対応 | Ollama (ローカル) をデフォルトに、OpenAI / Anthropic API にも切り替え可能 |

## アーキテクチャ

```
外部サービス ──HTTP POST──▶ FastAPI (port 8000)
                              │
                              ├─▶ Ollama (port 11434) で AI 分類
                              ├─▶ PostgreSQL (port 5432) に保管
                              └─▶ WebSocket でフロントエンドに通知
                                        │
                              React UI (port 5173) ◀─┘
```

## 必要なもの

- **Docker Desktop** (または Docker Engine + Docker Compose)
- **Cursor** または **VS Code** (Dev Containers 拡張機能)
- (オプション) NVIDIA GPU + ドライバー — GPU があれば LLM 推論が高速化

## セットアップ

### 1. リポジトリをクローン

```bash
git clone <repository-url>
cd 20260100_webhook
```

### 2. Dev Container で開く

Cursor / VS Code でプロジェクトを開き、コマンドパレットから実行:

```
Dev Containers: Reopen in Container
```

初回起動時に以下が自動で行われます:

1. Python パッケージのインストール (`requirements.txt`)
2. Ollama のデフォルトモデル (`gemma3:4b`) のダウンロード (~3GB)
3. PostgreSQL データベースの作成

### 3. サーバーを起動

コンテナ内のターミナルで:

```bash
# バックエンド
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# フロントエンド (別ターミナルで)
cd frontend && npm run dev
```

### 4. Webhook を送ってみる

```bash
# テスト送信 (ホスト側から)
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{"event": "push", "repository": "my-repo", "commits": [{"message": "初回コミット"}]}'
```

## LLM プロバイダーの切り替え

デフォルトはローカル LLM (Ollama) を使用します。クラウド LLM に切り替える場合は環境変数を設定してください。

### Ollama (デフォルト)

```bash
# 別のモデルに変更する場合
export OLLAMA_MODEL=gemma3:12b    # より高精度なモデル
export OLLAMA_MODEL=qwen3:8b      # 別の選択肢
```

コンテナ内からモデルを追加ダウンロード:

```bash
curl http://ollama:11434/api/pull -d '{"name": "gemma3:12b"}'
```

### OpenAI

```bash
# ホスト OS 側で API キーを設定 (コンテナに自動で引き渡される)
export OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
export LLM_PROVIDER=openai
```

### Anthropic

```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
export LLM_PROVIDER=anthropic
```

## プロジェクト構成

```
20260100_webhook/
├── .devcontainer/
│   ├── devcontainer.json    # Dev Container 設定 (ポート, 拡張機能, 環境変数)
│   ├── docker-compose.yml   # サービス定義 (app, db, ollama)
│   ├── Dockerfile           # 開発コンテナイメージ (Python 3.12)
│   └── post-create.sh       # 初回セットアップスクリプト
├── app/                     # FastAPI バックエンド (※これから作成)
│   ├── main.py              # エントリーポイント
│   ├── models/              # SQLAlchemy モデル
│   ├── routers/             # API エンドポイント
│   └── services/            # LLM 分類ロジック
├── frontend/                # React フロントエンド (※これから作成)
├── requirements.txt         # Python 依存パッケージ
└── README.md
```

## ポート一覧

| ポート | サービス | URL |
|--------|----------|-----|
| 8000 | FastAPI バックエンド | http://localhost:8000 |
| 5173 | React フロントエンド (Vite) | http://localhost:5173 |
| 5432 | PostgreSQL | `postgresql://webhook:webhook@localhost:5432/webhook_analyzer` |
| 11434 | Ollama API | http://localhost:11434 |

## データのリセット

```bash
# PostgreSQL のデータと Ollama のモデルを全削除
docker compose -f .devcontainer/docker-compose.yml down -v
```

## GPU について

- **NVIDIA GPU + WSL2**: `nvidia-container-toolkit` がインストールされていれば自動で GPU を使用
- **GPU なし**: CPU モードで自動フォールバック。`docker-compose.yml` の `deploy` セクションは無視される
- GPU の有無を確認: `docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi`

## ライセンス

TBD

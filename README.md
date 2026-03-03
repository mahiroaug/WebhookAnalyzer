# Webhook Analyzer

外部サービスからの Webhook を受信し、ペイロードを分類・保存・可視化する開発向けツールです。  
バックエンドは FastAPI、フロントエンドは React (Vite)、DB は PostgreSQL、LLM は Ollama（既定）を使用します。

## まず最初に（最短起動）

### 0) 前提

- Docker Desktop（macOS / Windows）または Docker Engine + Docker Compose（Linux）
- Cursor または VS Code + Dev Containers 拡張
- Windows の場合は WSL2 有効化

### 1) クローン

```bash
git clone <repository-url>
cd WebhookAnalyzer
```

### 2) `.env` を作成（任意）

外部公開（ngrok）やクラウド LLM を使う場合のみ作成します。

```bash
# ngrok（設定するとコンテナ起動時に自動トンネル起動）
NGROK_AUTH_TOKEN=your_ngrok_token

# OpenAI / Anthropic を使う場合（どちらか）
# LLM_PROVIDER=openai
# OPENAI_API_KEY=sk-...
#
# LLM_PROVIDER=anthropic
# ANTHROPIC_API_KEY=sk-ant-...
```

### 3) Dev Container で起動

コマンドパレットで以下を実行:

```text
Dev Containers: Reopen in Container
```

初回は自動セットアップ（pip / npm / マイグレーション / Ollama モデル準備）に時間がかかります。

### 4) 動作確認（推奨）

```bash
./scripts/e2e_smoke.sh
```

以下が OK になれば利用準備完了です。

- API（uvicorn, 8000）
- Frontend（vite, 5173）
- Webhook API（receive/list/detail/stats）
- ngrok エージェント（起動時のみ）

### 5) アクセス先

- フロントエンド: http://localhost:5173
- バックエンド: http://localhost:8000
- ngrok 公開 URL: `./scripts/e2e_smoke.sh` の出力、または `http://127.0.0.1:4040/api/tunnels`

---

## 概要

### 主な機能

| 機能         | 説明                                     |
| ------------ | ---------------------------------------- |
| Webhook 受信 | 任意サービスから HTTP POST を受信        |
| データ保存   | 受信 payload を PostgreSQL(jsonb) に保存 |
| 分類・分析   | LLM によるカテゴリ分類 / 分析            |
| UI 表示      | 一覧・詳細・統計をブラウザで確認         |
| 外部公開     | ngrok でローカル API を一時公開可能      |

### システム構成（概略）

```text
External Service -> ngrok(optional) -> FastAPI(:8000)
                                         |- PostgreSQL(:5432)
                                         |- Ollama(:11434)
                                         `- Web UI(Vite :5173)
```

## ドキュメント

- [Webhook UI ユーザーストーリー](./docs/user-stories-webhook-dashboard.md)
- [ネットワーク構成図](./docs/NETWORK_ARCHITECTURE.md)

## 起動と運用

### 自動起動されるプロセス

Dev Container 起動時（`postStartCommand`）に、以下を自動起動します。

- `uvicorn app.main:app --reload --reload-dir app --host 0.0.0.0 --port 8000`
- `npx vite --host`（`/workspace/frontend`）
- `ngrok http 8000`（`.env` に `NGROK_AUTH_TOKEN` がある場合）

### ログ確認

```bash
tail -f /tmp/uvicorn.log /tmp/vite.log /tmp/ngrok.log
```

### 手動起動（必要な場合）

```bash
# backend
uvicorn app.main:app --reload --reload-dir app --host 0.0.0.0 --port 8000

# frontend
cd frontend && npm run dev

# ngrok
ngrok http 8000
```

## テスト

### E2E スモーク

```bash
./scripts/e2e_smoke.sh
```

このスクリプトは次を確認します。

- Health check
- Webhook 受信 / 一覧 / 詳細 / 統計
- Frontend HTML 応答
- ngrok エージェント（起動していれば公開 URL を表示）

### Webhook 送信の手動確認

#### localhost送信(HTTP POST)

```bash
curl -X POST http://localhost:8000/api/webhooks/receive \
  -H "Content-Type: application/json" \
  -d '{"type":"transfer","coin":"test","hash":"0x123"}'
```

#### ngrok公開URL送信(HTTPS POST)

`<PUBLIC_URL>` は `e2e_smoke.sh` のngrok出力(https://xxx.ngrok-free.app)を参照のこと

```bash
curl -X POST https://<PUBLIC_URL>/api/webhooks/receive \
  -H "Content-Type: application/json" \
  -d '{"type":"transfer","coin":"test","hash":"0xabc"}'
```

### サンプルデータ バルク投入

`experimental/sample_data` のデータを一括投入して、件数が多い状態で画面・API を確認できます。

```bash
python scripts/load_sample_webhooks.py
./scripts/e2e_smoke.sh
```

投入後は http://localhost:5173 の一覧・詳細画面で表示を確認してください。

## LLM 設定

既定は Ollama です。`app/config.py` は `.env` を読み込みます。

### Ollama（既定）

- 既定値
  - `LLM_PROVIDER=ollama`
  - `OLLAMA_HOST=http://ollama:11434`
  - `OLLAMA_MODEL=gemma3:4b`

モデル追加例:

```bash
curl http://ollama:11434/api/pull -d '{"name":"gemma3:12b"}'
```

### OpenAI

`.env` に設定:

```dotenv
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

### Anthropic

`.env` に設定:

```dotenv
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
```

## GPU / プラットフォーム

`Reopen in Container` 時に `.devcontainer/setup-platform.sh` が OS と NVIDIA GPU を判定し、`docker-compose.override.yml` を自動生成します。

### macOS

- Docker VM 上で動作（Ollama は CPU モード）
- Docker メモリは 8GB 以上を推奨

### Windows (WSL2)

- WSL2 必須（WSL1 非対応）
- 可能ならリポジトリは WSL 側ファイルシステムに配置
- NVIDIA GPU 利用時は WSL2 対応ドライバーが必要

### Linux

- `nvidia-container-toolkit` があれば GPU 自動検出
- 動作確認例:

```bash
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi
```

## ポート一覧

| ポート | 用途            | URL / 接続先                                                   |
| ------ | --------------- | -------------------------------------------------------------- |
| 8000   | FastAPI API     | http://localhost:8000                                          |
| 5173   | React (Vite)    | http://localhost:5173                                          |
| 5432   | PostgreSQL      | `postgresql://webhook:webhook@localhost:5432/webhook_analyzer` |
| 11434  | Ollama API      | http://localhost:11434                                         |
| 4040   | ngrok Agent API | http://127.0.0.1:4040/api/tunnels                              |

## ディレクトリ構成

```text
WebhookAnalyzer/
├── .devcontainer/          # Dev Container / Docker Compose / 起動スクリプト
├── app/                    # FastAPI backend
├── frontend/               # React + Vite frontend
├── scripts/                # 補助スクリプト（e2e_smoke など）
├── requirements.txt
└── README.md
```

## クリーンアップ

### DB のデータのみ初期化

テーブル構造を保持したまま全レコードを削除する（DevContainer 内で実行）:

```bash
psql -h db -U webhook -d webhook_analyzer -c \
  "TRUNCATE webhooks, webhook_analyses, webhook_sessions, investigation_sessions RESTART IDENTITY CASCADE;"
```

### DB ボリュームごと削除

ボリュームを含めて停止・削除（テーブル構造も消えるため、再起動後に Alembic マイグレーションが必要）:

```bash
docker compose -f .devcontainer/docker-compose.yml down -v
```

## ライセンス

TBD

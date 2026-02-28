---
name: autonomous-dev
description: ユーザーストーリーの実装をブランチ作成から develop マージまで自律的に遂行する。「次のUSを実装」「US-XXXを実装して」「アジャイル開発を開始」「開発を進めて」と依頼されたときに使用する。
---

# 自律開発ワークフロー

US の選定からブランチ作成、TDD、受け入れ検証、develop マージまでを一気通貫で実行するスキル。

## 起動トリガー

- 「次のUSを実装して」
- 「US-XXX を実装して」
- 「アジャイル開発を開始」
- 「開発を進めて」

## Phase 0: 対象 US の決定

1. `docs/user-stories-backlog.md` を読み、`【未着手】` の US を P0 > P1 > P2、番号順で特定する
2. 対象 US の受け入れ基準（Given/When/Then）を読み取り、TodoWrite でタスクリストを作成する
3. `docs/user-stories-backlog.md` のステータスを `【実装中】` に更新する

ユーザーが US を明示指定した場合は、その US を対象とする。

## Phase 1: ブランチ作成（スキップ不可）

```bash
git checkout develop && git pull
git checkout -b feature/{story-id}-{desc}
```

**ガード**: ブランチ作成を確認できるまで Phase 2 に進まない。`git branch --show-current` で `feature/` プレフィックスを確認する。

## Phase 2: TDD — テスト先行

### バックエンド API 変更がある場合

1. `app/tests/test_{router名}.py` にテスト関数を先に書く
   - 期待するステータスコード・レスポンス構造を定義
   - 正常系 + 主要異常系（404, 400 等）
2. `pytest app/tests/ -v` を実行し、**新規テストが FAILED であることを確認する（Red）**
3. 実装を行う（スキーマ → モデル → サービス → ルーター）
4. `pytest app/tests/ -v` を実行し、**全テスト PASSED を確認する（Green）**
5. リファクタリング後、再度テストが通ることを確認する

### ビジネスロジックのみの変更

1. `app/tests/test_{module名}.py` に単体テストを先に書く
2. Red → Green → Refactor サイクルを回す

### フロントエンドのみの変更

テスト先行は不要。Phase 3 のブラウザ検証で担保する。

## Phase 3: 受け入れ検証

### バックエンド

```bash
pytest app/tests/ -v
```

全テスト PASSED を確認する。FAILED があれば修正してから先に進む。

### フロントエンド

1. `python scripts/load_sample_webhooks.py` でテストデータ投入
2. ブラウザで `http://localhost:5173` を開く
3. acceptance-testing スキルのワークフローに従い、Given/When/Then を検証する

## Phase 4: コミットとマージ

```bash
git add -A
git commit -m "{story-id}: {description in English}"
git checkout develop
git merge feature/{story-id}-{desc}
```

コミットメッセージは英語のみ。日本語禁止。

## Phase 5: 記録と次の US への遷移

1. 完了したストーリーを `docs/user-stories-backlog.md` から削除し、`docs/user-stories-completed.md` へ移動
2. `docs/user-stories-webhook-dashboard.md` の完了サマリテーブルに行を追記
3. `docs/sprint-log.md` に完了記録を追記
4. 検証結果をユーザーに報告する
5. ユーザーが継続を指示した場合、Phase 0 に戻り次の `【未着手】` US を選定する

## 中断・NG 時の対応

- 受け入れ基準に NG がある場合: 修正して Phase 3 を再実行する
- 全 NG を解消できない場合: ステータスを `【持ち越し】` とし、NG 理由を sprint-log.md に記録する
- ユーザーが中断を指示した場合: 現在の feature ブランチにコミットして作業を保存する

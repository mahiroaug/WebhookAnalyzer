# バックログ（未着手・実装中ユーザーストーリー）

> このファイルがアクティブなバックログの原本です。
> 新規USはここに追加し、完了したら [`user-stories-completed.md`](./user-stories-completed.md) へ移動します。

**関連ファイル:**
- プロジェクトコンテキスト・完了サマリ: [`user-stories-webhook-dashboard.md`](./user-stories-webhook-dashboard.md)
- 完了済みアーカイブ: [`user-stories-completed.md`](./user-stories-completed.md)
- スプリント記録: [`sprint-log.md`](./sprint-log.md)

---

## ストーリー候補（提案）

正式にUS化する前の候補。優先度・受け入れ基準が確定したら下の「未着手ストーリー」セクションへ移動する。

- サービス別テンプレート: Fireblocks/BitGo等の既知サービス向けにフィールド辞書を事前登録し、AI解説の精度を上げたい → **US-124 で正式化済み**、未知サービスの自動検索は **US-129 で正式化済み**
- 上記以外の候補（Replay・異常検知・マスキング・LLM比較・定義ファイルUI編集・定義ファイルdiff）→ **US-141〜US-146 で正式化済み**

---

## 未着手ストーリー

### Phase 8: UI バグ修正と検索体験の強化

### Phase 9: AI 分析結果の定義ファイル化

> US-141, US-142 は完了。→ [`user-stories-completed.md`](./user-stories-completed.md)

### Phase 10: AI 分析品質とセキュリティ

#### US-143 LLM 比較モード（P1）【未着手】

開発者として、provider（Ollama / OpenAI / Anthropic）や model を切り替えて同一 Webhook の AI 分析結果を比較したい。
なぜならプロンプト改善やモデル選定のフィードバックループを効率化したいから。

- 受け入れ基準
  - Given 詳細画面で Webhook を表示中、When 設定から provider / model を選択して「再分析」を実行、Then 選択した provider / model で分析が実行され結果が表示される
  - Given 同一 Webhook に対して複数 provider / model で分析、When 比較モードを有効にする、Then 2 つ以上の結果を並べて表示し差異を把握できる
  - Given 未設定の provider（例: API キー未設定の OpenAI）、When その provider を選択、Then 設定が必要な旨のエラーメッセージが表示される

### Phase 11: 画面遷移リファインメントと分析可観測性

> US-134 / US-135 は完了。→ [`user-stories-completed.md`](./user-stories-completed.md)

### Phase 12: DB 運用・メンテナンスツール

> 全サブコマンドを単一 CLI エントリポイント `scripts/dbadmin.py` に集約。US-136〜US-140 で実装済み。

### Phase 13: 高度機能・開発者体験

#### US-146 異常検知ルール（P1）【未着手】

運用担当エンジニアとして、特定フィールド条件を満たす Webhook 到達時に目立つ通知を出したい。
なぜなら重要なイベントや異常パターンを早期に検知し、トリアージを速めたいから。

- 受け入れ基準
  - Given 設定で検知ルール（例: amount > 1000000、status = failed）を登録、When 条件を満たす Webhook が届く、Then 一覧・詳細でバッジやハイライトで強調され、オプションで通知が発火する
  - Given ルールが複数ある、When 複数ルールに該当、Then それぞれが識別可能な形で表示される
  - Given ルールが未登録、When Webhook が届く、Then 従来どおり通常表示される（既存動作を維持）

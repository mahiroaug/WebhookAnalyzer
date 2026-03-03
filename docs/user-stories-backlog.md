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

> US-143 は完了。→ [`user-stories-completed.md`](./user-stories-completed.md)

### Phase 11: 画面遷移リファインメントと分析可観測性

> US-134 / US-135 は完了。→ [`user-stories-completed.md`](./user-stories-completed.md)

### Phase 12: DB 運用・メンテナンスツール

> 全サブコマンドを単一 CLI エントリポイント `scripts/dbadmin.py` に集約。US-136〜US-140 で実装済み。

### Phase 13: 高度機能・開発者体験

> US-146 は完了。→ [`user-stories-completed.md`](./user-stories-completed.md)

### Phase 14: AI 分析 UX 改善とバグ修正

> US-147〜US-152 は完了。→ [`user-stories-completed.md`](./user-stories-completed.md)

### Phase 15: リアルタイム体験と分析ログの品質改善

> US-153〜US-157 は完了。→ [`user-stories-completed.md`](./user-stories-completed.md)

### Phase 16: 表示体験の総合改善と PDF エクスポート

> US-158〜US-167 は完了。→ [`user-stories-completed.md`](./user-stories-completed.md)

### Phase 17: 表示品質改善・PDF 拡充・フィルタ連動

> US-168〜US-175 は完了。→ [`user-stories-completed.md`](./user-stories-completed.md)

### Phase 18: INBOX ヘッダー簡素化

> US-176 は完了。→ [`user-stories-completed.md`](./user-stories-completed.md)

### Phase 19: サービスステータスの表示改善とヘルスチェック信頼性向上

> US-177, US-178 は完了。→ [`user-stories-completed.md`](./user-stories-completed.md)

### Phase 20: お気に入り管理

> US-179 は完了。→ [`user-stories-completed.md`](./user-stories-completed.md)

### Phase 21: Unknown Webhook 自動分類

> US-180, US-181, US-182, US-183, US-184 は完了。→ [`user-stories-completed.md`](./user-stories-completed.md)

### Phase 22: UI 操作性改善

> US-185 は完了。→ [`user-stories-completed.md`](./user-stories-completed.md)

### Phase 23: AI 分析品質改善

> US-186 は完了。→ [`user-stories-completed.md`](./user-stories-completed.md)

### Phase 24: UI 体験カスタマイズと省エネ対応

#### US-187 LLM 有効/無効のグローバルトグル（P1）【未着手】

Web3エンジニアとして、AI 分析機能の有効/無効をグローバルヘッダーのスライドスイッチで切り替えたい。
なぜなら、LLM（Ollama）が常時リクエストを受け付ける状態では GPU ファンが唸り続け、分析が不要な調査時に騒音やリソース消費が気になるから。

- 受け入れ基準
  - Given グローバルヘッダーを確認する、When 表示する、Then ダークモードトグル横に「LLM」ラベル付きスライドスイッチ（ON/OFF）が表示され、現在の状態が視覚的に識別できる
  - Given LLM トグルが OFF の状態で、When 詳細画面の「Analyze」「Re-analyze」「Retry」ボタンをクリックする、Then 分析は実行されず「LLM を有効にしてから実行してください」のポップアップが表示される
  - Given LLM トグルが OFF の状態で、When ページをリロードする、Then OFF 状態が維持される（localStorage 保存）
  - Given LLM トグルを ON に切り替えた後、When 分析ボタンをクリックする、Then 通常通り AI 分析が実行される（後方互換）

#### US-188 新着エントリのグローエフェクト色をビビッドブルーに変更（P1）【未着手】

Web3エンジニアとして、新着 Webhook エントリのグロー（発光）エフェクトをビビッドなブルーに変更したい。
なぜなら、現在のグリーンは Live インジケータの緑と紛らわしく、ブルー LED イルミネーション的な鮮やかな青色のほうが「新着」の注意喚起として直感的で、ダークモードとの親和性も高いから。

- 受け入れ基準
  - Given 新規 Webhook が WebSocket 経由で着弾する、When 一覧ペインを確認する、Then 新着エントリの枠がビビッドブルー（rgba(59, 130, 246, ...) 〜 rgba(96, 165, 250, ...) 系、ブルー LED 的な明るい発光）でグローする
  - Given 未読エントリ（新着 3 秒後〜既読まで）、When 一覧ペインを確認する、Then 未読グローも同じブルー系の控えめな発光で表示される（緑色は使用しない）
  - Given WebhookListPage（テーブル表示）の新着行、When 確認する、Then テーブル行の背景もブルー系で統一される（emerald 系ではない）


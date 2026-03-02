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

#### US-186 LLM 出力トークン切断時の JSON 修復とプロンプト短縮（P1）【未着手】

Web3エンジニアとして、長大な Webhook ペイロード（Alchemy の topics 配列等）を分析したときに LLM 出力が途中切れで失敗しないようにしたい。
なぜなら、現在 gemma3:4b のトークン上限で JSON が閉じないまま切断され「LLM 出力が JSON ではありません」エラーになり、分析が完了しないから。

- 受け入れ基準
  - Given 長大なペイロード（topics 配列を含む Alchemy Webhook 等）に対して AI 分析を実行したとき、When LLM 出力がトークン上限で途中切断されても、Then 閉じブレース補完による JSON 修復を試み、修復成功時は分析結果が正常に保存される
  - Given Step 1 プロンプトに短縮指示（「各フィールド 1-2 文以内」）を追加したとき、When 分析を実行すると、Then 出力が短くなりトークン切断の発生率が低下する
  - Given JSON 修復も失敗したとき、When 分析結果を確認すると、Then 従来通り「LLM 出力が JSON ではありません」エラーが表示される（既存のフォールバック維持）


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

> US-180, US-181, US-182, US-183 は完了。→ [`user-stories-completed.md`](./user-stories-completed.md)

Web3エンジニアとして、unknown のまま残っている Webhook をフロントエンドから再分類したい。
なぜなら、classifier ルール追加後に過去の unknown を手動で curl する運用は非効率だから。

- 受け入れ基準
  - Given INBOX に `source="unknown"` の Webhook が 1 件以上あるとき、When INBOX ヘッダーを確認すると、Then「Reclassify All」ボタンが表示される。クリックすると `POST /api/webhooks/reclassify` が呼ばれ、完了後に一覧がリロードされ、結果（reclassified / unchanged 件数）が視覚的にわかる
  - Given 詳細ペインで `source="unknown"` の Webhook を表示しているとき、When ナビバーを確認すると、Then「Reclassify」ボタンが表示される。クリックすると当該 Webhook のみ再分類され、詳細表示が更新される
  - Given `source="unknown"` の Webhook が 0 件のとき、When INBOX ヘッダーを確認すると、Then「Reclassify All」ボタンは非表示になる
  - Given 詳細ペインで `source` が "unknown" でない Webhook を表示しているとき、When ナビバーを確認すると、Then「Reclassify」ボタンは表示されない


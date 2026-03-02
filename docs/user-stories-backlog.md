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

> US-180 は完了。→ [`user-stories-completed.md`](./user-stories-completed.md)

#### US-181 AI 分析時の unknown ソース自動再分類（P1）【未着手】

Web3エンジニアとして、`unknown/unknown` として保存された Webhook を AI 分析実行時に自動的にソースとイベントタイプを推定・再分類してほしい。
なぜなら、classifier のルールに未登録の新しいサービスや形式の Webhook でも、AI の推論力で正しいグループに分類でき、定義ファイル連携や検索性が向上するから。

- 受け入れ基準
  - Given `source="unknown"` の Webhook が存在するとき、When AI 分析を実行すると、Then LLM がペイロードから source と event_type を推定し、Webhook レコードの `source` / `event_type` / `group_key` が更新される
  - Given AI が source/event_type を推定できなかったとき、When 分析が完了すると、Then source/event_type は "unknown" のまま維持され、分析結果（summary / field_descriptions）は正常に保存される
  - Given `source="unknown"` でない（既に分類済みの）Webhook のとき、When AI 分析を実行すると、Then 既存の `source` / `event_type` / `group_key` は変更されない


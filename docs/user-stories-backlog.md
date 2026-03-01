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






#### US-175 source / event_type フィルタの相互連動（P1）【未着手】

開発者として、source を選択したら event_type の候補がそのソースに存在するものに絞られ、逆に event_type を選択したら source 候補も絞られてほしい。
なぜなら現状は全候補が常に表示されるため、存在しない組み合わせを選んでしまい空結果になることがあるから。

- 受け入れ基準
  - Given source に「bitgo」を選択する、When event_type プルダウンを開く、Then bitgo の Webhook に存在する event_type のみが候補として表示される
  - Given event_type に「transfer」を選択する、When source プルダウンを開く、Then transfer イベントを持つ source のみが候補として表示される
  - Given source も event_type もクリアする、When プルダウンを開く、Then 全候補が表示される（既存動作）
  - Given source を選択後に event_type を選択、When source をクリアする、Then event_type 候補が全件に戻る


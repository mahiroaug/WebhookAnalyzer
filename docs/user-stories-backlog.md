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

- 受信リクエスト再送（Replay）: 過去payloadを任意エンドポイントへ再送して再現試験したい
- 異常検知ルール: 特定フィールド条件を満たすWebhook到達時に目立つ通知を出したい
- マスキング表示: 個人情報/秘密情報を自動マスクして安全に共有したい
- LLM比較モード: provider/modelを切替えて分析品質を比較したい
- サービス別テンプレート: Fireblocks/BitGo等の既知サービス向けにフィールド辞書を事前登録し、AI解説の精度を上げたい → **US-124 で正式化済み**、未知サービスの自動検索は **US-129 で正式化済み**
- 定義ファイルの UI 編集: ブラウザ上で description を直接修正して YAML に反映したい
- 定義ファイルの diff 表示: AI 再分析時に既存定義との差分を表示してからマージしたい

---

## 未着手ストーリー

### Phase 8: UI バグ修正と検索体験の強化

### Phase 9: AI 分析結果の定義ファイル化

### Phase 10: AI 分析品質とセキュリティ



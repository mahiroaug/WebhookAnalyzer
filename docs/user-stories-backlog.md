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

#### US-128 ユーザーフィードバック付き再分析（P0）【実装中】

開発者として、AI 分析の改善指示（「XXXXは削る必要あり」等）を添えて再分析を実行したい。  
なぜならルールベースでは検知できない問題をユーザーが発見した際、手動で品質を修正したいから。

- 受け入れ基準
  - Given 詳細画面の再分析ボタン横、When 確認、Then フィードバック入力欄が表示されている（折りたたみ式）
  - Given フィードバックに「ハッシュ値を含めないこと」と入力、When 再分析実行、Then LLM プロンプト（Step 1）にユーザー指示が反映された状態で 3 層分析が実行される
  - Given フィードバック未入力、When 再分析実行、Then 従来通り通常の 3 層分析が実行される（後方互換）
  - Given フィードバック付き再分析の結果、When DB・YAML に保存、Then US-127 のサニタイズも適用された状態で保存される

#### US-129 API リファレンス自動 Web 検索（P1）【未着手】

開発者として、未知のサービスからの Webhook でも API ドキュメントを自動検索して AI 分析の根拠にしたい。  
なぜなら field_templates に reference_url が登録されていないサービスでは、LLM がドキュメントなしに推測するしかなく解説品質が低下するから。

US-127 の Step 0（エビデンス収集）を拡張する位置づけ。US-127 では既存 reference_url のフェッチのみだが、本ストーリーで「URL が無い場合に自動検索で補完する」機能を追加する。

- 受け入れ基準
  - Given field_templates に reference_url が登録されていない source/event_type、When AI 分析を実行、Then source 名と event_type から Web 検索が自動実行され、関連する API ドキュメントが取得される
  - Given Web 検索で取得したドキュメント、When Step 1（explanation 生成）の LLM プロンプトを確認、Then 検索結果の関連部分がコンテキストとして含まれている
  - Given Web 検索がタイムアウトまたは失敗、When AI 分析を実行、Then 検索結果なしで分析が続行される（エラーにならない）
  - Given 検索結果、When 確認、Then 取得元 URL が explanation に出典として記載される


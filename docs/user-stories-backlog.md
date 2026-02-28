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

#### US-127 AI 分析の 3 層出力化とルールベースサニタイズ（P0）【実装中】

開発者として、AI 分析結果を「個別解説・汎用キー説明・汎用概要」の 3 層に分離し、定義ファイルには固有値を含まない汎用情報のみ保存したい。  
なぜなら固有値（ハッシュ・アドレス・ID 等）が定義ファイルに永続化されるとセキュリティリスクとなり、同タイプの他 Webhook に流用できないから。

段階的抽象化チェーン（3 回 LLM 呼び出し）:
  - Step 0: エビデンス収集（既存 field_templates の reference_url フェッチ）
  - Step 1: LLM Call 1 → explanation（具体値 + API ドキュメントで個別解説）
  - Step 2: LLM Call 2 → field_descriptions（explanation から汎用キー説明を導出）
  - Step 3: LLM Call 3 → summary（field_descriptions から 1〜2 文の汎用要約）
  - 最終防衛: ルールベースサニタイズ（summary / field_descriptions のみ）

永続化戦略:
  - explanation: DB のみ（定義 YAML には書き出さない）。サニタイズ不要
  - field_descriptions: DB + 定義 YAML。サニタイズあり
  - summary: DB + 定義 YAML。サニタイズあり

- 受け入れ基準
  - Given AI 分析が成功する、When 分析完了、Then 3 回の LLM 呼び出しで explanation → field_descriptions → summary の順に段階的抽象化が行われる
  - Given Step 1（explanation）、When 生成、Then ペイロードの具体値と API リファレンスを根拠にした初心者向け個別解説である
  - Given Step 2（field_descriptions）、When 生成、Then explanation から固有値を除いた汎用的なフィールド説明であり、Payload テーブルの説明列にも反映される
  - Given Step 3（summary）、When 生成、Then field_descriptions を 1〜2 文に要約した汎用概要であり、同 event_type の他 Webhook でも通用する文言である
  - Given summary / field_descriptions、When ペイロード値（6 文字以上）と一致する文字列が残っている、Then ルールベースサニタイズにより自動除去される
  - Given explanation、When 定義 YAML を確認、Then explanation は YAML に書き出されていない（DB のみ保存）
  - Given 詳細画面の AI 分析結果セクション、When 表示、Then 「概要」「個別解説」「Key 説明」の 3 層で階層表示される
  - Given Step 0（エビデンス収集）、When 既存 field_templates に reference_url がある、Then URL の内容をフェッチし LLM プロンプトに含める

#### US-128 ユーザーフィードバック付き再分析（P0）【未着手】

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


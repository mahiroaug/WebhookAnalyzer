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
- サービス別テンプレート: Fireblocks/BitGo等の既知サービス向けにフィールド辞書を事前登録し、AI解説の精度を上げたい → **US-124 で正式化済み**
- 定義ファイルの UI 編集: ブラウザ上で description を直接修正して YAML に反映したい
- 定義ファイルの diff 表示: AI 再分析時に既存定義との差分を表示してからマージしたい

---

## 未着手ストーリー

### Phase 8: UI バグ修正と検索体験の強化

#### US-123 グローバルヘッダーのホームリンク（P1）【実装中】

利用者として、「Webhook Analyzer」ロゴをクリックしてトップページに戻りたい。  
なぜなら調査中に初期状態に素早くリセットしたいから。

- 受け入れ基準
  - Given ヘッダーの「Webhook Analyzer」、When クリック、Then URL が `/`（FQDN のルート）に遷移し、2ペイン画面が初期状態で表示される
  - Given 詳細表示中、When ロゴクリック、Then 右ペインの選択状態がリセットされ、プレースホルダーが表示される

### Phase 9: AI 分析結果の定義ファイル化

#### US-124 フィールド辞書の YAML 定義ファイル化（P0）【未着手】

開発者として、フィールド辞書をリポジトリ内の YAML ファイルで管理したい。  
なぜなら Python ハードコードでは追加・修正のたびにコード変更が必要で、非エンジニアが編集できないから。

- 受け入れ基準
  - Given `definitions/{source}/{event_type}.yaml` が存在する、When 詳細画面を開く、Then YAML から読み込んだフィールド説明が Payload テーブルの「説明」列に表示される
  - Given 既存の `field_templates.py` のハードコードデータ、When マイグレーション実行、Then 全データが YAML ファイルとして `definitions/` に出力される
  - Given `get_field_template()` の呼び出し元、When 動作確認、Then インターフェースが変わらず既存機能が正常に動作する
  - Given `definitions/` に YAML ファイルが存在しない source/event_type、When 詳細表示、Then 説明列は空のまま正常表示される（エラーにならない）

#### US-125 AI 分析成功時の定義ファイル自動書き出し（P0）【未着手】

開発者として、AI 分析が成功したら結果を自動的に YAML 定義ファイルに蓄積したい。  
なぜなら一度得た分析知見をリポジトリに永続化し、チームで共有・再利用したいから。

- 受け入れ基準
  - Given AI 分析が成功する、When 分析完了、Then `definitions/{source}/{event_type}.yaml` に summary と field_descriptions が書き出される
  - Given 同一 source/event_type の YAML が既に存在する、When AI 分析成功、Then 既存の手動記載フィールドは上書きされず、AI 由来の新規フィールドのみ追記される
  - Given 書き出されたフィールド、When YAML を確認、Then AI 由来であることを示す `ai_generated: true` メタデータが付与されている
  - Given YAML ファイルが存在しない source/event_type、When 初回 AI 分析成功、Then 新規 YAML ファイルが自動作成される

#### US-126 定義ファイルからの分析結果キャッシュ読み込み（P1）【未着手】

開発者として、DB に分析結果がなくても定義ファイルがあればフィールド説明を即座に表示したい。  
なぜなら LLM が利用不可な環境でも過去の分析知見を活用して調査を進めたいから。

- 受け入れ基準
  - Given DB に分析結果がない Webhook、When 定義ファイルが存在する source/event_type の詳細を開く、Then 定義ファイルの summary と field_descriptions が表示される
  - Given 定義ファイルから読み込んだ結果、When 表示、Then 「定義ファイルから読み込み」であることが UI 上で識別できる
  - Given DB に分析結果があり定義ファイルも存在する、When 詳細表示、Then DB の結果が優先される
  - Given 「再分析」を実行、When 成功、Then DB が更新されるとともに定義ファイルもマージ更新される

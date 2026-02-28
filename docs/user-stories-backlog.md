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

#### US-120 詳細ペインの UI バグ修正とボタン改善（P0）【未着手】

開発者として、詳細ペインのバグを修正し、AI 分析ボタンをモダンなデザインにしたい。  
なぜなら重複ボタンやレイアウト崩れが調査の流れを阻害するから。

- 受け入れ基準
  - Given リクエストヘッダーの details を開いた状態で別 Webhook に遷移、When 新しい詳細が表示、Then リクエストヘッダーの開閉状態が維持される
  - Given AI 分析済みの Webhook、When 詳細を表示、Then 「再分析を実行」ボタンが 1 箇所のみ表示される（重複なし）
  - Given AI 分析ボタン、When 確認、Then ゴーストスタイル（枠線 + テキスト、DIM テーマに調和）で表示される
  - Given Payload テーブルのネスト行、When 確認、Then 値・型・説明の列幅が親行と揃っている
  - Given 文字列値、When Payload テーブルで表示、Then ダブルクォーテーションなしで表示される（型列の "string" で判別可能）

#### US-121 AI 分析の JSON パース堅牢化（P0）【未着手】

開発者として、LLM が想定外の形式を返しても分析結果が壊れないようにしたい。  
なぜなら「unexpected: "summary"」のような不明エラーでは原因特定ができないから。

- 受け入れ基準
  - Given LLM が JSON でなくプレーンテキストを返す、When 分析実行、Then 「[分析失敗] LLM 出力が JSON ではありません」と表示される
  - Given LLM が {"summary": "..."} のみ（field_descriptions なし）を返す、When 分析実行、Then summary のみ表示され field_descriptions は空で正常処理される
  - Given LLM 応答の parsed が dict でない（リスト・文字列等）、When 分析実行、Then 「[分析失敗] 不正な応答形式」と表示される
  - Given 分析失敗、When ログを確認、Then LLM の生出力（先頭 500 文字）がログに記録されている

#### US-122 Payload 全文検索と検索結果一覧モード（P0）【未着手】

開発者として、トランザクションハッシュやアドレス等の値で Webhook を横断検索したい。  
なぜなら特定のトランザクションに関連する通知を素早く見つけたいから。

- 受け入れ基準
  - Given グローバルヘッダー、When 確認、Then 全文検索用の入力欄が表示されている
  - Given 検索窓にテキストを入力、When Enter / 検索実行、Then payload 内の値を含む Webhook が一覧ペインに表示される
  - Given 検索結果モード中、When 結果行をクリック、Then 右ペインに該当 Webhook の詳細が表示される
  - Given 検索窓をクリア、When 実行、Then 通常の一覧表示モードに戻る
  - Given 検索結果が 0 件、When 表示、Then 「該当する Webhook がありません」と表示される

#### US-123 グローバルヘッダーのホームリンク（P1）【未着手】

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

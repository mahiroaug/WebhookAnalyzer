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

#### US-143 LLM 比較モード（P1）【完了】

開発者として、provider（Ollama / OpenAI / Anthropic）や model を切り替えて同一 Webhook の AI 分析結果を比較したい。
なぜならプロンプト改善やモデル選定のフィードバックループを効率化したいから。

- 受け入れ基準
  - Given 詳細画面で Webhook を表示中、When 設定から provider / model を選択して「再分析」を実行、Then 選択した provider / model で分析が実行され結果が表示される
  - Given 同一 Webhook に対して複数 provider / model で分析、When 比較モードを有効にする、Then 2 つ以上の結果を並べて表示し差異を把握できる
  - Given 未設定の provider（例: API キー未設定の OpenAI）、When その provider を選択、Then 設定が必要な旨のエラーメッセージが表示される

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

#### US-158 Payload 表示モード切替（テーブル / JSON 生データ）（P1）【未着手】

開発者として、Payload セクションでテーブル表示と JSON 生データ表示（インデント整形済み）を切り替えたい。
なぜなら構造を把握するにはテーブルが便利だが、API 連携やドキュメント作成時には JSON をそのままコピーしたいから。

- 受け入れ基準
  - Given Payload セクションが表示されている、When 「Table」/「JSON」タブを切り替える、Then テーブル表示と JSON 生データ表示が切り替わる
  - Given JSON 表示モード、When JSON を確認する、Then インデント整形済み（2 スペース）のシンタックスハイライト付き JSON が表示される
  - Given JSON 表示モード、When コピーボタンをクリックする、Then JSON 全文がクリップボードにコピーされ、コピー完了フィードバック（チェックマーク）が表示される
  - Given テーブル表示モード、When 確認する、Then 既存の PayloadTable 機能（展開/折りたたみ、辞書説明、マスキング等）が正常に動作する

#### US-160 一覧ペインの未読エントリハイライトと既読管理（P1）【未着手】

開発者として、一覧ペインで未読（未選択）の Webhook エントリを視覚的に区別し、選択時に自動で既読にしたい。
なぜなら 500 件表示の中からまだ確認していないエントリを素早く見つけたいから。

- 受け入れ基準
  - Given 新規 Webhook が受信された、When 一覧ペインを確認する、Then 未読エントリが太字テキストと左端のアクセントバーで視覚的に強調される
  - Given 未読エントリをクリックする、When 詳細ペインに表示される、Then そのエントリが自動的に既読に変わり、太字とアクセントバーが解除される
  - Given 既読/未読状態、When ブラウザをリロードする、Then 状態が DB に永続化されているため維持される
  - Given 全エントリが既読の状態で新規 Webhook が着弾する、When 一覧を確認する、Then 新着エントリのみ未読として表示される

#### US-161 一覧ペインの表示件数拡大（500 件）（P1）【実装中】

開発者として、一覧ペインに最大 500 件の Webhook を表示したい。
なぜなら現在の 50 件では調査対象の全体像が把握できず、ページ送りの手間が多いから。

#### US-162 INBOX ヘッダーのサービス接続状況表示（P1）【未着手】

開発者として、INBOX ヘッダーに各サービスの接続状況（公開 URL / ローカル API / PostgreSQL / Ollama）を一目で確認したい。
なぜなら Webhook 調査の前提となるサービス稼働状況をブラウザ上で即座に把握したいから。

- 受け入れ基準
  - Given INBOX ヘッダーを表示する、When 確認する、Then 以下 4 項目が縦並びで接続状況とともに表示される: (1) 公開 URL（ngrok 等）と Live / Offline ステータス (2) ローカル API（localhost:8000）と Live / Offline ステータス (3) PostgreSQL プロセス稼働状況（Live / Offline） (4) Ollama プロセス稼働状況（Live / Offline）
  - Given ngrok が起動している、When バックエンドが ngrok API（`http://localhost:4040/api/tunnels`）を自動検出する、Then 公開 URL と「Live」が緑ドットで表示される
  - Given ngrok が未起動、When 検出を試みる、Then 「Offline」がグレードットで表示される
  - Given いずれかのサービスがダウンした、When ステータスが変わる、Then 定期ポーリング（30 秒間隔）で状態が更新される

#### US-163 event_type フィルタのプルダウン選択肢表示（P1）【未着手】

開発者として、event_type フィルタにも source と同じくプルダウン選択肢を表示したい。
なぜなら event_type の正確な名前を覚えていなくても選択できるようにしたいから。

- 受け入れ基準
  - Given 一覧ペインの event_type フィルタ、When フォーカスする、Then 受信済み event_type の一覧がプルダウンで表示される
  - Given プルダウンに候補がある、When テキストを入力する、Then 入力文字列で候補がフィルタリングされる
  - Given プルダウンの候補をクリックする、When 選択する、Then event_type フィルタに反映される
  - Given フィルタにテキストを直接入力する、When 部分一致で検索する、Then テキスト入力による検索も引き続き機能する

#### US-164 フィルタ入力のインクリメンタルサーチ（P1）【未着手】

開発者として、source / event_type フィルタに 1 文字入力するごとに一覧の検索結果がダイナミックに更新されてほしい。
なぜなら Enter キーを押したり値を選択したりする前に、候補を絞り込んで素早く目的のエントリを見つけたいから。

- 受け入れ基準
  - Given source フィルタにテキストを入力する、When 1 文字入力するごと、Then 300ms 程度のデバウンスの後、一覧が自動的にフィルタリングされる
  - Given event_type フィルタにテキストを入力する、When 1 文字入力するごと、Then 同様にデバウンス後に一覧が自動更新される
  - Given 高速にタイプする、When デバウンス中に次の文字が入力される、Then 最後の入力から 300ms 後にのみ API が呼ばれ、不要なリクエストが抑制される
  - Given フィルタをクリアする、When 入力欄を空にする、Then 全件表示に戻る

#### US-165 UI ボタンラベルの英語統一（P1）【実装中】

開発者として、操作ボタンのラベルを英語に統一したい。
なぜならデータが英語であるため、ボタンも英語のほうが自然で、コードとの一貫性も保てるから。

- 受け入れ基準
  - Given Payload テーブル、When ボタンを確認する、Then 「全展開」→「Expand All」、「全折りたたみ」→「Collapse All」、「保存」→「Save」、「キャンセル」→「Cancel」と英語で表示される
  - Given 詳細ペインの遷移ボタン、When 確認する、Then 「← 前へ」→「← Prev」、「次へ →」→「Next →」と英語で表示される
  - Given 一覧ペインのページネーション、When 確認する、Then 「前」→「Prev」、「次」→「Next」と英語で表示される
  - Given 詳細ペインの再送ボタン、When 確認する、Then 「再送」→「Replay」、「送信」→「Send」、「送信中...」→「Sending...」と英語で表示される
  - Given AI 分析ボタン、When 確認する、Then 「AI で分析」→「Analyze」、「再分析を実行」→「Re-analyze」、「分析中...」→「Analyzing...」と英語で表示される
  - Given マスキングチェックボックス、When 確認する、Then 「機密情報をマスク」→「Mask Sensitive Data」と英語で表示される


開発者として、詳細ペインに表示中の Webhook を PDF レポートとしてエクスポートしたい。
なぜなら調査結果を社内共有やドキュメント化する際に、印刷可能な形式で出力したいから。

- 受け入れ基準
  - Given 詳細ペインで Webhook を表示中、When 「Export PDF」ボタンをクリックする、Then PDF ファイルが生成されダウンロードされる
  - Given 生成された PDF、When 内容を確認する、Then リクエスト情報（HTTP メソッド・ヘッダー・IP）、Payload 情報（整形済み JSON）、AI 分析結果（概要・個別解説・フィールド説明）が含まれている
  - Given PDF のデザイン、When 確認する、Then Web UI のダークテーマを踏襲したカラーパレット・タイポグラフィで作成されている
  - Given AI 分析が未実行の Webhook、When PDF を出力する、Then AI 分析結果セクションは「Not analyzed」と表示され、エラーにならない

#### US-167 一括既読操作と未読フィルタ（P2）【未着手】

開発者として、複数の未読エントリを一括で既読にし、未読のみをフィルタリングしたい。
なぜなら 500 件表示で未読が大量にある場合、1 件ずつ開くのは非効率だから。

- 受け入れ基準
  - Given 一覧ペインに未読エントリがある、When 「Mark All Read」ボタンをクリックする、Then 現在のフィルタ条件に一致する全エントリが既読に変更される
  - Given 一覧ペイン、When 「Unread Only」フィルタを有効にする、Then 未読エントリだけが表示される
  - Given 全て既読にした後、When フィルタを解除する、Then 全エントリが通常表示に戻る


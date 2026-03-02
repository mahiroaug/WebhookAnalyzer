# 完了済みユーザーストーリー アーカイブ

> このファイルは完了済みストーリーの詳細（受け入れ基準含む）を保管するアーカイブです。
> アクティブなバックログは [`user-stories-webhook-dashboard.md`](./user-stories-webhook-dashboard.md) を参照してください。

## Phase 1: MVP（ダッシュボード実用化）

### US-001 受信一覧の即時可視化（P0）【完了】

開発者として、最新Webhookを時系列で一覧したい。  
なぜなら受信可否と受信タイミングを最短で判断したいから。

- 受け入れ基準（Given/When/Then）
  - Given Webhookが1件以上保存されている、When 一覧画面を開く、Then 最新順で最低限の列（ID/Source/EventType/ReceivedAt）が表示される
  - Given 一覧上の行を選ぶ、When クリックする、Then 該当Webhook詳細へ遷移できる

### US-002 絞り込みによるノイズ削減（P0）【完了】

開発者として、`source` と `event_type` で一覧を絞り込みたい。  
なぜなら目的イベントの調査に集中したいから。

- 受け入れ基準
  - Given 一覧に複数種のイベントがある、When `source` を指定する、Then 指定sourceのみ表示される
  - Given 一覧に複数種のイベントがある、When `event_type` を指定する、Then 指定event_typeのみ表示される

### US-003 ページングで大量データを安定閲覧（P0）【完了】

運用担当として、件数が多くても一覧を段階的に閲覧したい。  
なぜならブラウザ負荷と読み込み待ちを抑えたいから。

- 受け入れ基準
  - Given 100件以上のWebhookがある、When 一覧を開く、Then 初期表示は1ページ分のみ取得される
  - Given 次ページに進む、When ページ操作する、Then 連続して表示崩れなく閲覧できる

### US-004 状態別UI（読み込み/空/エラー）の明確化（P1）【完了】

利用者として、画面状態を誤解しないUIを使いたい。  
なぜなら操作ミスや再送判断ミスを減らしたいから。

- 受け入れ基準
  - Given API応答待ち、When 画面表示中、Then ローディング状態が視覚的に識別できる
  - Given データ0件、When 一覧表示、Then 空状態の説明と次アクションが表示される
  - Given API失敗、When 一覧表示、Then エラー文言と再試行導線が表示される

## Phase 2: 詳細画面の調査性向上

### US-005 詳細情報の一画面集約（P0）【完了】

開発者として、Webhookのメタ情報とPayloadを同一画面で見たい。  
なぜなら調査中に画面遷移を減らしたいから。

- 受け入れ基準
  - Given 詳細画面を開く、When 表示完了、Then source/event_type/group_key/received_at/payloadが確認できる
  - Given 一覧へ戻る、When 戻る操作、Then 調査コンテキストを維持したまま遷移できる

### US-006 Payload JSONの要素分解表示（P0）【完了】

開発者として、深いJSONをツリー形式で理解したい。  
なぜならネストや配列の構造を素早く把握したいから。

- 受け入れ基準
  - Given ネストされたJSON、When 詳細表示、Then 展開/折りたたみで階層を追える
  - Given フィールドを確認、When 要素を見る、Then キー・型・値が識別できる
  - Given 特定値を共有したい、When コピー操作、Then 値またはJSONPathをコピーできる

### US-007 重要フィールドの視認性向上（P1）【完了】

QAとして、検証観点に直結する項目を早く見つけたい。  
なぜなら期待値との照合時間を短縮したいから。

- 受け入れ基準
  - Given payload内にID/amount/statusなどの主要項目がある、When 詳細表示、Then 重要項目をハイライト表示できる
  - Given 重要項目が欠損、When 表示、Then 欠損が視覚的に分かる

## Phase 3: AI解説と分析高度化

### US-008 フィールドごとのAI解説（P0）【完了】

開発者として、各フィールドの意味と用途をAIに解説してほしい。  
なぜなら仕様書なしでもpayloadを理解したいから。

- 受け入れ基準
  - Given 詳細画面で分析を実行、When 成功する、Then 要約とフィールド別説明が表示される
  - Given フィールド説明がある、When フィールド一覧を見る、Then keyごとに説明文が対応づけられる

### US-009 AI分析失敗時の回復導線（P0）【完了】

開発者として、分析失敗時に理由を把握し再実行したい。  
なぜなら調査を止めずに継続したいから。

- 受け入れ基準
  - Given AI分析が失敗、When 結果表示、Then 失敗理由が明示される
  - Given 失敗表示中、When 再分析を実行、Then 再試行でき結果が更新される

### US-010 分析ステータスの一覧可視化（P1）【完了】

運用担当として、どのWebhookが分析済みか一覧で把握したい。  
なぜなら未分析レコードを優先処理したいから。

- 受け入れ基準
  - Given 一覧画面、When レコード表示、Then 分析済み/未分析ステータスが表示される
  - Given 未分析のみ見たい、When フィルタ適用、Then 未分析レコードだけ表示できる

## Phase 4: webhook.siteライク運用拡張

### US-011 リアルタイム受信反映（P0）【完了】

開発者として、新着Webhookを即時に画面反映したい。  
なぜならデバッグ時の待機と手動リロードを減らしたいから。

- 受け入れ基準
  - Given 一覧画面を開いている、When 新規Webhook受信、Then 一覧へ自動反映される
  - Given リアルタイム接続断、When 再接続可能、Then 自動復旧または再接続操作ができる

### US-012 比較ビュー（同一group_key/イベント比較）（P1）【完了】

QAとして、正常系と異常系の差分を比較したい。  
なぜなら原因候補を素早く絞り込みたいから。

- 受け入れ基準
  - Given 複数Webhookを選択、When 比較画面を開く、Then 差分フィールドが強調表示される
  - Given 同一group_keyで比較、When 表示、Then 時系列差分が確認できる

### US-013 保存ビュー/共有リンク（P2）【完了】

CSとして、調査結果を再現可能な形で共有したい。  
なぜならチーム内のやりとりを迅速化したいから。

- 受け入れ基準
  - Given フィルタ条件を設定、When 保存する、Then 再利用できるビューとして保持される
  - Given 保存ビューを共有、When URL発行、Then 同じ条件で画面を開ける

## Phase 5: 調査・レポート

### US-014 event_type別の網羅一覧（P0）【完了】

Web3エンジニアとして、受信済みWebhookをevent_typeごとにグルーピングして一覧したい。  
なぜなら「どんな種類の通知が届いたか」を網羅的に把握したいから。

- 受け入れ基準
  - Given 複数event_typeのWebhookがある、When グルーピング表示する、Then event_typeごとの件数と代表例が確認できる
  - Given 未知のevent_typeが届いた、When 一覧を見る、Then 新規タイプとして目立つ表示がされる

### US-015 ペイロード構造のスキーマ自動推定（P0）【完了】

Web3エンジニアとして、同一event_typeの複数Webhookから共通のJSONスキーマを自動推定したい。  
なぜなら手動でフィールドを拾い上げる作業を省きたいから。

- 受け入れ基準
  - Given 同一event_typeのWebhookが3件以上ある、When スキーマ推定を実行する、Then 共通フィールド・型・出現率が表示される
  - Given オプショナルなフィールドがある、When スキーマ表示、Then 必須/任意の区別が分かる

### US-016 調査レポートのエクスポート（P0）【完了】

Web3エンジニアとして、調査結果をMarkdownレポートとしてエクスポートしたい。  
なぜなら社内ドキュメントや連携設計書に転記したいから。

- 受け入れ基準
  - Given 分析済みのWebhookがある、When レポート出力を実行する、Then source/event_type別にフィールド説明・スキーマ・サンプルペイロードを含むMarkdownが生成される
  - Given 生成されたレポート、When ダウンロードする、Then .mdファイルとして保存できる

### US-017 一括AI分析（P1）【完了】

Web3エンジニアとして、未分析のWebhookをまとめてAI分析にかけたい。  
なぜなら1件ずつ手動実行する手間を省きたいから。

- 受け入れ基準
  - Given 未分析Webhookが複数ある、When 一括分析を実行する、Then 対象全件が順次分析される
  - Given 一括分析中、When 進捗を確認する、Then 完了/失敗の件数が表示される

### US-018 調査セッション管理（P1）【完了】

Web3エンジニアとして、調査単位（例: 「Fireblocks監査系調査 2026-02」）でWebhookをグルーピングしたい。  
なぜなら複数の調査を並行して進めたいから。

- 受け入れ基準
  - Given セッション（タグ/ラベル）を作成する、When Webhookにセッションを紐づける、Then セッション単位で絞り込み・レポート出力ができる
  - Given 複数セッションがある、When セッション一覧を見る、Then 各セッションの件数・期間が確認できる

### US-019 サービス別フィールド辞書テンプレート（P0）【完了】

Web3エンジニアとして、Fireblocks/BitGo などサービス別に event_type ごとのフィールド辞書を即座に参照したい。  
なぜなら payload の意味解釈にかかる時間を減らし、調査の初動を速めたいから。

- 受け入れ基準
  - Given `source=fireblocks` など対応済みサービスのWebhook詳細を開く、When 表示する、Then event_type に対応した主要フィールドの意味・注意点・参照先が表示される
  - Given テンプレートに未定義のフィールドが含まれる、When 詳細を確認する、Then 未知フィールドとして視覚的に識別され、辞書への追加候補として扱える
  - Given AI分析を実行する、When 結果を表示する、Then テンプレート知識を補助情報として解説に反映できる

### US-020 スキーマドリフト検知（P1）【完了】

Web3エンジニアとして、同一 event_type のpayload構造変化（追加・欠落・型変更）を自動検知したい。  
なぜなら外部サービスの仕様変更を早期に検知し、連携不具合を未然に防ぎたいから。

- 受け入れ基準
  - Given 同一 event_type の履歴データがある、When 新規Webhookを受信する、Then 直近の基準スキーマとの差分（追加/削除/型変更）が表示される
  - Given 互換性リスクの高い差分（必須項目の欠落・型変更）がある、When 一覧を確認する、Then 該当レコードにドリフト警告が表示される
  - Given ドリフト検知されたレコードがある、When フィルタを適用する、Then ドリフト有りレコードのみを抽出できる

## Phase 6: デザイン刷新（PolygonScan DIM + Apple HIG）

### US-101 グローバルレイアウトとナビゲーションの統一（P0）【完了】

利用者として、全画面で一貫したヘッダーとナビゲーションを使いたい。  
なぜなら現在地の把握と画面遷移をスムーズにしたいから。

- 受け入れ基準
  - Given 任意のページを開く、When 画面表示、Then 共通ヘッダー（アプリ名・ナビリンク）が表示される
  - Given ナビリンクをクリック、When 遷移、Then ページ全体のリロードなしで切り替わる
  - Given 現在のページ、When ナビを見る、Then アクティブなリンクが視覚的に識別できる

### US-102 DIMカラーテーマの適用（P0）【完了】

利用者として、長時間の調査でも目が疲れにくい洗練されたダークUIを使いたい。  
なぜなら Webhook 調査は長時間作業になるから。

- 受け入れ基準
  - Given 画面を開く、When 表示、Then PolygonScan DIM 風のミュートなカラーパレット（`#12161C` 系背景、`#E4E6EA` 系テキスト）が適用されている
  - Given 全ページ、When 確認、Then アクセント色がミュートな青（`blue-400` 相当）で統一されている
  - Given `index.css`、When 確認、Then Vite デフォルトスタイルが除去され Tailwind のみで構成されている

### US-103 ダークモード手動トグル（P1）【完了】

利用者として、ダーク/ライトモードを手動で切り替えたい。  
なぜなら環境に応じて見やすい表示を選びたいから。

- 受け入れ基準
  - Given ヘッダー上のトグル、When クリック、Then ダーク/ライトが即座に切り替わる
  - Given モード選択後、When ページをリロード、Then 選択が維持される（localStorage 保存）
  - Given OS 設定がダーク、When 初回アクセス、Then OS 設定に従ったモードで表示される

### US-104 タイポグラフィとスペーシングの統一（P1）【完了】

利用者として、画面全体で統一されたフォント・余白・階層感のあるUIを使いたい。  
なぜなら情報の優先度を直感的に判断したいから。

- 受け入れ基準
  - Given 全ページ、When 確認、Then フォントファミリー（SF Pro 系 + 日本語フォント）が統一されている
  - Given カード・テーブル・セクション、When 確認、Then 余白が `p-4`/`p-6`/`gap-6` で一貫している
  - Given 見出し・本文・補助テキスト、When 確認、Then サイズ・ウェイトの階層が明確である

### US-105 テーブル・カード・ボタンのコンポーネント洗練（P1）【完了】

利用者として、PolygonScan のような情報密度が高くても読みやすいテーブルとカードを使いたい。  
なぜなら大量の Webhook データを効率的にスキャンしたいから。

- 受け入れ基準
  - Given 一覧テーブル、When 表示、Then 行ホバーが控えめ（`bg-slate-800/40`）で、ボーダーが薄い半透明である
  - Given ボタン、When 確認、Then プライマリ/セカンダリ/ゴーストの3種が統一されている
  - Given タグ・バッジ、When 確認、Then 半透明グレー系（`bg-slate-600/60`）で鮮やかすぎない

### US-106 JSONビューアのデザイン改善（P2）【完了】

開発者として、JSON ツリーをコードエディタ風の洗練された配色で読みたい。  
なぜなら長いペイロードの構造把握に集中したいから。

- 受け入れ基準
  - Given JSON ツリー表示、When 確認、Then キーはミュートオレンジ（`#D4A574`）、文字列は薄緑（`#9FDFBF`）、数値は薄青で表示される
  - Given 展開/折りたたみ操作、When 実行、Then アニメーションが滑らかで視覚的に追いやすい

### US-107 新着Webhookのリアルタイム挿入通知（P1）【完了】

利用者として、新着Webhookが届いたことをアニメーションと効果音で即座に知りたい。  
なぜなら調査中にリロードせず受信状況を把握したいから。

- 受け入れ基準
  - Given 一覧画面を開いている、When 新規Webhookを受信、Then リスト先頭にスライドインアニメーションで行が挿入される
  - Given 新着行が挿入された、When 表示、Then 数秒間ハイライト表示され新着と分かる
  - Given 新規Webhookを受信、When 効果音が有効、Then 控えめなチャイム音が再生される
  - Given 効果音が煩わしい、When ミュートボタンを押す、Then 効果音のみ無効化できる

### US-108 コピー / JSONPathコピーの修正とフィードバック（P0）【完了】

開発者として、JSONツリーの値やJSONPathを確実にコピーし、成功を視覚的に確認したい。  
なぜならコピーできたか分からないと調査効率が落ちるから。

- 受け入れ基準
  - Given プリミティブ値の横のコピーアイコン、When クリック、Then 値がクリップボードにコピーされる
  - Given JSONPathアイコン、When クリック、Then JSONPath（例: `$.data.status`）がコピーされる
  - Given コピー成功、When 表示、Then アイコンがチェックマークに変わり1秒後に戻る（トースト不要）
  - Given クリップボードAPIが使えない環境、When コピー、Then フォールバック（`document.execCommand`）で動作する

### US-109 JSONビューアのインタラクションをモダン化（P1）【完了】

開発者として、コピー操作をアイコンベースの控えめなUIで行いたい。  
なぜならボタンが多すぎるとJSONの可読性が下がるから。

- 受け入れ基準
  - Given プリミティブ値の行、When ホバー、Then コピーアイコンとPathアイコンがフェードインで表示される（通常時は非表示）
  - Given アイコン、When 確認、Then クリップボードアイコン（コピー）とパスアイコン（JSONPath）で区別できる
  - Given ボタン、When 確認、Then テキストラベル（「コピー」「Path」）ではなくアイコンのみで表示される

### US-110 詳細画面の前後エントリ遷移（P1）【完了】

開発者として、詳細画面から前後のWebhookに直接遷移したい。  
なぜなら一覧に戻らず連続して調査したいから。

- 受け入れ基準
  - Given 詳細画面を開いている、When ヘッダーを見る、Then 「前へ」「次へ」の遷移ボタンが表示される
  - Given 「次へ」をクリック、When 遷移、Then 時系列で次のWebhook詳細が表示される
  - Given 最新のWebhookを表示中、When 確認、Then 「次へ」は無効化（disabled）される
  - Given キーボード操作、When 左右矢印キーを押す、Then 前後のWebhookに遷移できる

## Phase 7: 開発ツール UX 刷新

### US-111 webhook.site 風 2ペインレイアウト（P0）【完了】

開発者として、一覧と詳細を同一画面の左右ペインで同時に見たい。  
なぜなら画面遷移なしで次々と Webhook を調査したいから。

- 受け入れ基準
  - Given 画面を開く、When 表示完了、Then 左ペイン（一覧リスト）と右ペイン（詳細/比較/スキーマ等）が左右分割で表示される
  - Given 左ペインで Webhook をクリック、When 選択、Then 右ペインに詳細が表示され、URL も `/webhooks/:id` に更新される
  - Given 右ペインで「比較」「スキーマ推定」「event_type別」を選ぶ、When 表示切替、Then 右ペインの内容が切り替わる（左ペインは維持）
  - Given 左ペイン、When 確認、Then 各エントリに受信連番（#1, #2...）・source・event_type・受信日時が表示される
  - Given ブラウザバック、When 実行、Then 前の選択状態に戻る（URLベースのルーティング）

### US-112 Payload 表形式表示とフィールド辞書統合（P0）【完了】

開発者として、Payload の各フィールドを「キー・値・型・辞書説明」の表形式で一覧したい。  
なぜならツリー表示よりも一覧性が高く、フィールドの意味を即座に把握できるから。

- 受け入れ基準
  - Given Payload を表示、When 確認、Then 各フィールドが表形式（パス / 値 / 型 / 辞書説明）で表示される
  - Given ネストされたオブジェクト、When 展開、Then 子要素が入れ子テーブルとして表示される（ツリーの階層感を維持）
  - Given フィールド辞書テンプレートが存在する source/event_type、When 表示、Then 辞書の説明がテーブルの「説明」列に統合表示される
  - Given 辞書に未定義のフィールド、When 確認、Then 「未知」バッジが表示され、辞書追加候補として識別できる
  - Given AI 分析結果がある、When 表示、Then 分析による field_descriptions もテーブルの「説明」列にマージ表示される

### US-113 受信順グローバルインデックス（P0）【完了】

開発者として、各 Webhook に受信順の通し番号（#1, #2, #3...）を振りたい。  
なぜなら「何番目に届いた通知か」で会話やレポートで参照しやすくなるから。

- 受け入れ基準
  - Given Webhook が受信される、When 保存、Then 全 Webhook 通しの受信順インデックス（1始まり）が自動付与される
  - Given 一覧（左ペイン）を見る、When 確認、Then 各エントリに `#1`, `#2` 等のインデックスが表示される
  - Given 詳細画面を見る、When 確認、Then ヘッダーにインデックス番号が表示される
  - Given 既存の Webhook（インデックス未付与）がある、When マイグレーション実行、Then received_at 順にインデックスが遡及付与される

### US-114 AI 分析エラーのレジリエンス強化（P0）【完了】

開発者として、LLM 接続が不安定でも分析機能が 500 エラーにならず、適切なエラー情報を返してほしい。  
なぜなら 500 エラーでは原因が分からず、調査が止まるから。

- 受け入れ基準
  - Given Ollama に接続できない、When 分析を実行、Then 500 ではなくエラー理由（接続不可・モデル未ロード等）が明示される
  - Given Ollama のレスポンス形式が想定外、When 分析を実行、Then 安全にフォールバックし「[分析失敗] レスポンス形式エラー」と表示される
  - Given LLM_PROVIDER が openai や anthropic に設定されている、When 分析を実行、Then 設定されたプロバイダーで分析が実行される
  - Given 分析 API が例外を投げる、When サーバーログを確認、Then exc_info 付きのログが記録されている

### US-115 詳細画面セクション順序の最適化（P1）【完了】

開発者として、詳細画面のセクション順序を調査フローに合わせたい。  
なぜなら「まず Payload を読み、次に AI に聞く」が自然なワークフローだから。

- 受け入れ基準
  - Given 詳細画面を開く、When 表示、Then セクション順序が「メタ情報 → スキーマドリフト → Payload（辞書統合済み） → AI 分析結果 → AI 分析ボタン」である
  - Given AI 分析が未実行、When 表示、Then Payload セクション下部に「AI で分析」ボタンが表示される
  - Given AI 分析済み、When 表示、Then Payload テーブルの「説明」列に分析結果がマージされ、分析結果セクションに要約が表示される

### US-116 HTTP リクエストメタデータの保存と表示（P0）【完了】

開発者として、Webhook 受信時の HTTP メソッド・ヘッダー・送信元 IP を確認したい。  
なぜなら payload だけでなくリクエスト全体の情報がデバッグに必要だから。

- 受け入れ基準
  - Given Webhook を受信、When 保存、Then HTTP メソッド・リクエストヘッダー・送信元 IP アドレスが DB に記録される
  - Given 詳細画面を開く、When 表示、Then メタ情報セクションに HTTP メソッド・IP・主要ヘッダーが表示される
  - Given 一覧（左ペイン）を見る、When 確認、Then 各エントリに HTTP メソッド（POST 等）と送信元 IP が表示される
  - Given 既存の Webhook（メタデータなし）、When 詳細表示、Then メタデータ欄は「未記録」と表示される（エラーにならない）

### US-117 ペインリサイズとレスポンシブ対応（P1）【完了】

開発者として、左右ペインの幅をドラッグで調整したい。  
なぜなら Payload が長い場合は右ペインを広げ、一覧確認時は左を広げたいから。

- 受け入れ基準
  - Given 2ペイン表示中、When ペイン境界をドラッグ、Then 左右の幅比率が変わる
  - Given 幅比率を変更した、When ページをリロード、Then 変更した比率が維持される（localStorage 保存）
  - Given モバイル幅、When 表示、Then 左ペインのみ表示され、タップで詳細に遷移するフォールバック動作になる

### US-118 詳細画面のアコーディオンセクション（P1）【完了】

開発者として、詳細画面の各セクション（メタ情報・ヘッダー・Payload・分析結果）を折りたたみたい。  
なぜなら必要な情報に素早くフォーカスし、画面のスクロール量を減らしたいから。

- 受け入れ基準
  - Given 詳細画面を開く、When セクションヘッダーをクリック、Then 該当セクションが折りたたみ/展開される
  - Given セクションを折りたたんだ、When 別の Webhook に遷移、Then 折りたたみ状態が維持される
  - Given 全セクション、When 確認、Then Payload セクションはデフォルト展開、他はコンパクト表示がデフォルトである

### US-119 一覧ペインの UI バグ修正と source アイコン表示（P0）【完了】

開発者として、一覧ペインでより多くの Webhook を快適にスキャンしたい。  
なぜならフィルタの崩れやアイコン不在が調査スピードを落とすから。

- 受け入れ基準
  - Given 左ペインの検索窓、When ペイン幅 200px 時に確認、Then source と event_type が縦積みで崩れず表示される
  - Given source フィルタ、When クリック、Then 受信済み source の一覧がプルダウンで選択できる（テキスト入力も可）
  - Given 一覧のエントリ、When 表示、Then インデックス左に source 別アイコン（fireblocks / bitgo / alchemy 等）が表示される
  - Given 一覧のエントリ、When 確認、Then 各行の高さがコンパクト（py-1.5 相当）で 1 ページに多くの件数が見える
  - Given 未知の source、When 表示、Then デフォルトのジェネリックアイコンが表示される

### US-120 詳細ペインの UI バグ修正とボタン改善（P0）【完了】

開発者として、詳細ペインのバグを修正し、AI 分析ボタンをモダンなデザインにしたい。  
なぜなら重複ボタンやレイアウト崩れが調査の流れを阻害するから。

- 受け入れ基準
  - Given リクエストヘッダーの details を開いた状態で別 Webhook に遷移、When 新しい詳細が表示、Then リクエストヘッダーの開閉状態が維持される
  - Given AI 分析済みの Webhook、When 詳細を表示、Then 「再分析を実行」ボタンが 1 箇所のみ表示される（重複なし）
  - Given AI 分析ボタン、When 確認、Then ゴーストスタイル（枠線 + テキスト、DIM テーマに調和）で表示される
  - Given Payload テーブルのネスト行、When 確認、Then 値・型・説明の列幅が親行と揃っている
  - Given 文字列値、When Payload テーブルで表示、Then ダブルクォーテーションなしで表示される（型列の "string" で判別可能）

### US-121 AI 分析の JSON パース堅牢化（P0）【完了】

開発者として、LLM が想定外の形式を返しても分析結果が壊れないようにしたい。  
なぜなら「unexpected: "summary"」のような不明エラーでは原因特定ができないから。

- 受け入れ基準
  - Given LLM が JSON でなくプレーンテキストを返す、When 分析実行、Then 「[分析失敗] LLM 出力が JSON ではありません」と表示される
  - Given LLM が {"summary": "..."} のみ（field_descriptions なし）を返す、When 分析実行、Then summary のみ表示され field_descriptions は空で正常処理される
  - Given LLM 応答の parsed が dict でない（リスト・文字列等）、When 分析実行、Then 「[分析失敗] 不正な応答形式」と表示される
  - Given 分析失敗、When ログを確認、Then LLM の生出力（先頭 500 文字）がログに記録されている

### US-122 Payload 全文検索と検索結果一覧モード（P0）【完了】

開発者として、トランザクションハッシュやアドレス等の値で Webhook を横断検索したい。  
なぜなら特定のトランザクションに関連する通知を素早く見つけたいから。

- 受け入れ基準
  - Given グローバルヘッダー、When 確認、Then 全文検索用の入力欄が表示されている
  - Given 検索窓にテキストを入力、When Enter / 検索実行、Then payload 内の値を含む Webhook が一覧ペインに表示される
  - Given 検索結果モード中、When 結果行をクリック、Then 右ペインに該当 Webhook の詳細が表示される
  - Given 検索窓をクリア、When 実行、Then 通常の一覧表示モードに戻る
  - Given 検索結果が 0 件、When 表示、Then 「該当する Webhook がありません」と表示される

### US-123 グローバルヘッダーのホームリンク（P1）【完了】

利用者として、「Webhook Analyzer」ロゴをクリックしてトップページに戻りたい。  
なぜなら調査中に初期状態に素早くリセットしたいから。

- 受け入れ基準
  - Given ヘッダーの「Webhook Analyzer」、When クリック、Then URL が `/`（FQDN のルート）に遷移し、2ペイン画面が初期状態で表示される
  - Given 詳細表示中、When ロゴクリック、Then 右ペインの選択状態がリセットされ、プレースホルダーが表示される

### US-124 フィールド辞書の YAML 定義ファイル化（P0）【完了】

開発者として、フィールド辞書をリポジトリ内の YAML ファイルで管理したい。  
なぜなら Python ハードコードでは追加・修正のたびにコード変更が必要で、非エンジニアが編集できないから。

- 受け入れ基準
  - Given `definitions/{source}/{event_type}.yaml` が存在する、When 詳細画面を開く、Then YAML から読み込んだフィールド説明が Payload テーブルの「説明」列に表示される
  - Given 既存の `field_templates.py` のハードコードデータ、When マイグレーション実行、Then 全データが YAML ファイルとして `definitions/` に出力される
  - Given `get_field_template()` の呼び出し元、When 動作確認、Then インターフェースが変わらず既存機能が正常に動作する
  - Given `definitions/` に YAML ファイルが存在しない source/event_type、When 詳細表示、Then 説明列は空のまま正常表示される（エラーにならない）

### US-125 AI 分析成功時の定義ファイル自動書き出し（P0）【完了】

開発者として、AI 分析が成功したら結果を自動的に YAML 定義ファイルに蓄積したい。  
なぜなら一度得た分析知見をリポジトリに永続化し、チームで共有・再利用したいから。

- 受け入れ基準
  - Given AI 分析が成功する、When 分析完了、Then `definitions/{source}/{event_type}.yaml` に summary と field_descriptions が書き出される
  - Given 同一 source/event_type の YAML が既に存在する、When AI 分析成功、Then 既存の手動記載フィールドは上書きされず、AI 由来の新規フィールドのみ追記される
  - Given 書き出されたフィールド、When YAML を確認、Then AI 由来であることを示す `ai_generated: true` メタデータが付与されている
  - Given YAML ファイルが存在しない source/event_type、When 初回 AI 分析成功、Then 新規 YAML ファイルが自動作成される

### US-126 定義ファイルからの分析結果キャッシュ読み込み（P1）【完了】

開発者として、DB に分析結果がなくても定義ファイルがあればフィールド説明を即座に表示したい。  
なぜなら LLM が利用不可な環境でも過去の分析知見を活用して調査を進めたいから。

- 受け入れ基準
  - Given DB に分析結果がない Webhook、When 定義ファイルが存在する source/event_type の詳細を開く、Then 定義ファイルの summary と field_descriptions が表示される
  - Given 定義ファイルから読み込んだ結果、When 表示、Then 「定義ファイルから読み込み」であることが UI 上で識別できる
  - Given DB に分析結果があり定義ファイルも存在する、When 詳細表示、Then DB の結果が優先される
  - Given 「再分析」を実行、When 成功、Then DB が更新されるとともに定義ファイルもマージ更新される

### US-127 AI 分析の 3 層出力化とルールベースサニタイズ（P0）【完了】

開発者として、AI 分析結果を「個別解説・汎用キー説明・汎用概要」の 3 層に分離し、定義ファイルには固有値を含まない汎用情報のみ保存したい。  
なぜなら固有値（ハッシュ・アドレス・ID 等）が定義ファイルに永続化されるとセキュリティリスクとなり、同タイプの他 Webhook に流用できないから。

- 受け入れ基準
  - Given AI 分析が成功する、When 分析完了、Then 3 回の LLM 呼び出しで explanation → field_descriptions → summary の順に段階的抽象化が行われる
  - Given Step 1（explanation）、When 生成、Then ペイロードの具体値と API リファレンスを根拠にした初心者向け個別解説である
  - Given Step 2（field_descriptions）、When 生成、Then explanation から固有値を除いた汎用的なフィールド説明であり、Payload テーブルの説明列にも反映される
  - Given Step 3（summary）、When 生成、Then field_descriptions を 1〜2 文に要約した汎用概要であり、同 event_type の他 Webhook でも通用する文言である
  - Given summary / field_descriptions、When ペイロード値（6 文字以上）と一致する文字列が残っている、Then ルールベースサニタイズにより自動除去される
  - Given explanation、When 定義 YAML を確認、Then explanation は YAML に書き出されていない（DB のみ保存）
  - Given 詳細画面の AI 分析結果セクション、When 表示、Then 「概要」「個別解説」「Key 説明」の 3 層で階層表示される
  - Given Step 0（エビデンス収集）、When 既存 field_templates に reference_url がある、Then URL の内容をフェッチし LLM プロンプトに含める

### US-128 ユーザーフィードバック付き再分析（P0）【完了】

開発者として、AI 分析の改善指示（「XXXXは削る必要あり」等）を添えて再分析を実行したい。  
なぜならルールベースでは検知できない問題をユーザーが発見した際、手動で品質を修正したいから。

- 受け入れ基準
  - Given 詳細画面の再分析ボタン横、When 確認、Then フィードバック入力欄が表示されている（折りたたみ式）
  - Given フィードバックに「ハッシュ値を含めないこと」と入力、When 再分析実行、Then LLM プロンプト（Step 1）にユーザー指示が反映された状態で 3 層分析が実行される
  - Given フィードバック未入力、When 再分析実行、Then 従来通り通常の 3 層分析が実行される（後方互換）
  - Given フィードバック付き再分析の結果、When DB・YAML に保存、Then US-127 のサニタイズも適用された状態で保存される

### US-129 API リファレンス自動 Web 検索（P1）【完了】

開発者として、未知のサービスからの Webhook でも API ドキュメントを自動検索して AI 分析の根拠にしたい。  
なぜなら field_templates に reference_url が登録されていないサービスでは、LLM がドキュメントなしに推測するしかなく解説品質が低下するから。

- 受け入れ基準
  - Given field_templates に reference_url が登録されていない source/event_type、When AI 分析を実行、Then source 名と event_type から Web 検索が自動実行され、関連する API ドキュメントが取得される
  - Given Web 検索で取得したドキュメント、When Step 1（explanation 生成）の LLM プロンプトを確認、Then 検索結果の関連部分がコンテキストとして含まれている
  - Given Web 検索がタイムアウトまたは失敗、When AI 分析を実行、Then 検索結果なしで分析が続行される（エラーにならない）
  - Given 検索結果、When 確認、Then 取得元 URL が explanation に出典として記載される

### US-130 Payload テーブルのカラムヘッダー英語化と値の全文表示（P1）【完了】

開発者として、Payload テーブルのカラムヘッダーを英語表記にし、値を省略せず改行付きで全文表示したい。  
なぜならトランザクションハッシュやアドレス等の値が途中で切れると照合・コピーに支障をきたし、データが英語である以上ヘッダーも英語が自然だから。

- 受け入れ基準
  - Given Payload テーブルを表示、When カラムヘッダーを確認、Then 「key」「value」「type」「description」と英語で表示される
  - Given 長い値（トランザクションハッシュ等 64 文字以上）を含む Payload、When テーブルを表示、Then 値が省略（truncate）されず改行折り返しで全文表示される
  - Given ネストされたオブジェクトの子要素、When 展開、Then 子要素の値も同様に全文表示される
  - Given 既存の機能（値クリックコピー等）、When 全文表示後に操作、Then 既存機能が正常に動作する（後方互換）

### US-131 ソースイニシャルアイコンの導入（P1）【完了】

開発者として、一覧ペインの source アイコンを source 名の頭文字イニシャルを使った丸形カラーアイコンに変更したい。
なぜなら現在の抽象的な SVG アイコンでは一目でどのサービスか判別できず、Webhook 調査時のスキャン効率が下がるから。

- 受け入れ基準
  - Given 一覧ペインに Webhook が表示されている、When source アイコンを確認、Then source 名の頭文字（大文字）が丸い色付き背景の上に白文字で表示されている
  - Given 異なる source（例: fireblocks, bitgo）の Webhook、When アイコンを比較、Then source ごとに異なる背景色が割り当てられている
  - Given 未知の source（KNOWN_SOURCES に定義がない場合）、When アイコンを確認、Then source 名の頭文字がデフォルトカラーの丸アイコンで表示される（エラーにならない）
  - Given アイコン、When サイズを確認、Then w-5 h-5（20px）で表示されている

### US-132 ページ遷移のフラッシュレス化（P0）【完了】

開発者として、一覧↔詳細の遷移時にコンテンツが一瞬消える「暗転」を無くし、前のコンテンツを表示し続けたまま新データに差し替えてほしい。
なぜなら 0.5 秒の空白画面は視覚的なストレスとなり、差分の把握を妨げるから。

- 受け入れ基準
  - Given 左ペインで別の Webhook をクリック、When 詳細ペインが遷移、Then 前の詳細コンテンツが表示されたまま新データがロードされ、取得完了後に即座に差し替わる（「読み込み中...」テキストが表示されない）
  - Given データ取得に 1 秒以上かかる場合、When ローディング中、Then 前のコンテンツ上に控えめなインジケータ（例: ヘッダー部分の薄いプログレスバー）が表示される
  - Given 初回アクセス（前のコンテンツがない場合）、When 表示、Then スケルトンまたは最小限のプレースホルダーが表示される（テキストのみの「読み込み中...」ではない）

### US-133 AI 分析ボタンのスピナーアニメーション（P1）【完了】

開発者として、「再分析を実行」ボタンの待機中にスピナー（回転アニメーション）を表示してほしい。
なぜなら「分析中...」テキストだけでは処理が進行中なのかフリーズしているのか判別しにくいから。

- 受け入れ基準
  - Given 「AI で分析」または「再分析を実行」ボタンをクリック、When 分析中、Then ボタン内にスピナーアイコン（CSS アニメーション回転）がテキスト横に表示される
  - Given スピナー表示中、When ボタンを確認、Then ボタンは disabled 状態で再クリックできない
  - Given 分析が完了または失敗、When 結果が返る、Then スピナーが消えボタンが元の状態に戻る

### US-136 DB 統計・ヘルスチェック CLI（P0）【完了】

運用担当エンジニアとして、DB の状態をターミナルから一目で確認したい。
なぜなら問題の早期発見とキャパシティ計画のために、レコード数・ディスク使用量・未分析件数を定期的に把握したいから。

- 受け入れ基準
  - Given DevContainer 内で `python scripts/dbadmin.py stats` を実行、When 正常接続時、Then テーブルごとのレコード数・ディスク使用量・source 別件数・event_type 別件数・最古/最新レコード日時・未分析 Webhook 件数が表示される
  - Given DB に接続できない、When コマンドを実行、Then 接続エラーが明示され終了コード 1 で終了する

### US-137 Webhook レコード検索・詳細表示 CLI（P0）【完了】

運用担当エンジニアとして、ターミナルから Webhook レコードを検索・閲覧したい。
なぜなら GUI にアクセスできない状況でも素早くレコードの内容を確認したいから。

- 受け入れ基準
  - Given Webhook データがある、When `python scripts/dbadmin.py list --source fireblocks --limit 10` を実行、Then 該当レコードが ID・インデックス・source・event_type・受信日時を含む表形式で表示される
  - Given Webhook ID を指定、When `python scripts/dbadmin.py show <id>` を実行、Then メタ情報・Payload（JSON 整形）・分析結果が表示される
  - Given フィルタ条件に一致するレコードがない、When list を実行、Then 「該当レコードなし」と表示される
  - Given `--format json` オプション、When 実行、Then 出力が JSON 形式になる（パイプ処理向け）

### US-138 データ削除・パージ CLI（P1）【完了】

運用担当エンジニアとして、条件を指定して Webhook データを安全に削除したい。
なぜならテスト後の不要データや古いレコードを整理しストレージを健全に保ちたいから。

- 受け入れ基準
  - Given `python scripts/dbadmin.py delete --source test --before 2026-01-01` を実行、When 確認プロンプトに y を入力、Then 条件一致レコードが CASCADE 削除される
  - Given delete コマンド、When 実行、Then 削除対象件数を事前表示し確認プロンプト（y/N）を出す（`--yes` で確認スキップ可能）
  - Given `python scripts/dbadmin.py purge --older-than 30d` を実行、When 確認して実行、Then 30 日超のレコードが一括削除され削除件数が報告される
  - Given `python scripts/dbadmin.py reset --all` を実行、When 二重確認に y を入力、Then 全テーブルが TRUNCATE され件数が報告される

### US-139 AI 分析結果リセット CLI（P1）【完了】

運用担当エンジニアとして、AI 分析結果のみをリセットして再分析の準備をしたい。
なぜなら LLM モデル変更やプロンプト改善後に全レコードを再分析したいケースがあるから。

- 受け入れ基準
  - Given `python scripts/dbadmin.py analysis reset --source fireblocks` を実行、When 確認して実行、Then 該当 source の分析結果（webhook_analyses）のみが削除され Webhook レコード自体は保持される
  - Given `python scripts/dbadmin.py analysis reset --all` を実行、When 確認して実行、Then 全分析結果が削除される
  - Given `python scripts/dbadmin.py analysis status` を実行、When 表示、Then 分析済み/未分析の件数が source 別に表示される

### US-140 DB メンテナンス CLI（P2）【完了】

運用担当エンジニアとして、DB の最適化とインデックスの整合性を維持したい。
なぜなら大量削除後のデッドタプル回収やシーケンス欠番の修正が必要な場合があるから。

- 受け入れ基準
  - Given `python scripts/dbadmin.py maintain vacuum` を実行、When 実行、Then 全テーブルに VACUUM ANALYZE が実行される
  - Given `python scripts/dbadmin.py maintain reindex` を実行、When 実行、Then sequence_index が received_at 順に 1 から連番で再採番される
  - Given reindex 完了後、When 一覧を確認、Then 欠番なく連続した番号が振られている

### US-144 マスキング表示（P1）【完了】

開発者として、個人情報や秘密情報を自動でマスクして画面を安全に共有したい。
なぜなら社内共有やドキュメント化の際に誤って機密を漏らすリスクを減らしたいから。

- 受け入れ基準
  - Given デフォルトマスキング対象（private_key, api_key, address 等）が設定済み、When Payload を表示、Then 該当フィールドの値が `***` でマスクされる
  - Given マスキング ON / OFF のチェックボックスがある、When OFF にする、Then フル値が表示される
  - Given マスキング対象のフィールドがネストされている、When 表示、Then ネストしたフィールドもマスクされる

### US-145 受信リクエスト再送（Replay）（P1）【完了】

QA として、過去の Webhook payload を任意のエンドポイントへ再送して再現試験したい。
なぜなら webhook.site の Replay のように、本番相当のリクエストで開発環境やステージングのエンドポイントを検証したいから。

- 受け入れ基準
  - Given 詳細画面で Webhook を表示中、When 「再送」ボタンをクリックし対象 URL を入力して送信、Then 同じ payload と可能な限り同じ HTTP ヘッダーで指定 URL へ POST される
  - Given 再送実行、When 送信成功、Then レスポンスステータス・所要時間が表示される
  - Given 再送先 URL が無効、When 再送を実行、Then 接続エラー等が表示され、送信失敗が明確に分かる

### US-134 AI 分析の実行ログリアルタイムストリーミング（P0）【完了】

開発者として、AI 分析の進行中に各ステップの LLM プロンプト・レスポンス・所要時間などの生ログをリアルタイムで確認したい。
なぜなら分析の内部動作を可視化することで、品質改善のフィードバックや問題特定が格段に速くなるから。

- 受け入れ基準
  - Given AI 分析を実行、When 分析開始、Then 詳細ペイン最下部にログテキストボックスが自動展開される … **OK**: 初回ログ到達時に自動展開
  - Given 分析中、When 各ステップ（Evidence 収集 → Explanation → Fields → Summary）が実行される、Then SSE で各ステップの開始・メッセージ・所要時間がリアルタイムにストリーミング表示される … **OK**: POST /webhooks/{id}/analyze/stream、triggerAnalyzeStream
  - Given サニタイズやファイル書き出し、When 実行される、Then それらの処理ログもストリームに含まれる … **OK**: write_yaml イベントをバックエンドが送信
  - Given 分析完了後、When ページを遷移して戻る、Then ログは sessionStorage に保持され前回ログが閲覧可能 … **OK**: webhook-analysis-logs
  - Given 分析完了後、When ログテキストボックスのヘッダーを確認、Then 総所要時間が表示される … **OK**: ヘッダーに Xs 表示

### US-135 AI 分析の 4 ステッププログレスバー（P1）【完了】

開発者として、AI 分析の進捗をステップインジケータで一目で確認したい。
なぜならログテキストボックスを見なくても「今どの段階か」を直感的に把握したいから。

- 受け入れ基準
  - Given AI 分析を実行、When 分析中、Then 分析ボタンの直下に 4 ステップ（エビデンス → 解説 → フィールド → 保存）のプログレスインジケータが表示される … **OK**
  - Given 各ステップ完了時、When インジケータを確認、Then 完了ステップが緑、未着手がグレーで表示される … **OK**
  - Given US-134 のログストリーミング、When SSE イベントを受信、Then プログレスバーとログビューアが同期して更新される … **OK**

### US-141 定義ファイルの UI 編集（P1）【完了】

開発者として、フィールド辞書の description をブラウザ上で直接編集し YAML 定義ファイルに反映したい。
なぜなら definitions ディレクトリを手で編集する手間を省き、UI 上で即時修正してキャッシュ読み込み（US-126）と連携させたいから。

- 受け入れ基準
  - Given 定義ファイル由来のフィールド辞書が表示されている、When 該当フィールドの description をクリックして編集モードにし内容を変更し保存、Then 変更が YAML 定義ファイルに書き込まれ、画面に即時反映される … **OK**: PATCH /api/definitions/{source}/{event_type}/fields、PayloadTable インライン編集
  - Given 編集を開始したがキャンセルする場合、When キャンセルを選択、Then 変更は破棄され元の内容が表示される … **OK**: キャンセルボタン
  - Given 定義ファイルが読み取り専用または存在しない、When 編集を試みる、Then 編集不可の旨が表示されるか編集 UI が無効になる … **OK**: writable=false 時は編集 UI 非表示

### US-142 定義ファイルの diff 表示（P1）【完了】

開発者として、AI 再分析時に既存定義と新結果の差分を確認してからマージしたい。
なぜなら AI の提案を盲目的に取り込まず、意図しない上書きを防ぎたいから。

- 受け入れ基準
  - Given 既存定義があり AI 再分析を実行、When 分析完了、Then 既存 vs 新結果の diff（追加・削除・変更）が表示される … **OK**: DefinitionDiffModal、computeDiff
  - Given diff 表示中、When 「マージ」「スキップ」「部分的に適用」を選択、Then 選択に応じて定義が更新される、または更新されない … **OK**: すべてマージ / 選択だけマージ / スキップ
  - Given diff に conflict がない場合、When マージを実行、Then 定義が更新され success 等のフィードバックが表示される … **OK**: マージ後 refetch で即時反映

### US-143 LLM 比較モード（P1）【完了】

開発者として、provider（Ollama / OpenAI / Anthropic）や model を切り替えて同一 Webhook の AI 分析結果を比較したい。

- 受け入れ基準
  - Given 詳細画面で Webhook を表示中、When 設定から provider / model を選択して「再分析」を実行、Then 選択した provider / model で分析が実行され結果が表示される … **OK**: LLM 設定（Ollama + model オーバーライド）
  - Given 同一 Webhook に対して複数 provider / model で分析、When 比較モードを有効にする、Then 2 つ以上の結果を並べて表示し差異を把握できる … **OK**: 比較モードで複数結果をグリッド表示
  - Given 未設定の provider（例: API キー未設定の OpenAI）、When その provider を選択、Then 設定が必要な旨のエラーメッセージが表示される … **OK**: 400 で "not supported"（Ollama のみ対応）

### US-146 異常検知ルール（P1）【完了】

運用担当エンジニアとして、特定フィールド条件を満たす Webhook 到達時に目立つ通知を出したい。

- 受け入れ基準
  - Given 設定で検知ルール（例: amount > 1000000、status = failed）を登録、When 条件を満たす Webhook が届く、Then 一覧・詳細でバッジやハイライトで強調され、オプションで通知が発火する … **OK**: 検知ルールページで登録、一覧・詳細にバッジ表示
  - Given ルールが複数ある、When 複数ルールに該当、Then それぞれが識別可能な形で表示される … **OK**: バッジにルール名を表示
  - Given ルールが未登録、When Webhook が届く、Then 従来どおり通常表示される（既存動作を維持） … **OK**

### US-149 AI 分析完了後の「未知」バッジ即時解除（P0）【完了】

開発者として、AI 分析（または再分析）で `field_descriptions` が返されたフィールドの「未知」バッジを速やかに消してほしい。
なぜなら AI が既に説明を付けたフィールドに「未知」が残り続けるのは誤解を招き、定義ファイルのマージ操作を待たずに解消されるべきだから。

- 受け入れ基準
  - Given AI 分析が成功し `field_descriptions` にフィールド説明がある、When Payload テーブルを確認、Then AI が説明を付けたフィールドの「未知」バッジが消えている … **OK**: knownFieldPaths に分析キーをマージ、description あり時は isUnknown=false
  - Given 定義ファイルにも AI 分析にもないフィールド、When Payload テーブルを確認、Then 「未知」バッジが引き続き表示される … **OK**
  - Given 再分析を実行、When 新しい `field_descriptions` が返る、Then 新たに説明されたフィールドの「未知」も消える … **OK**

### US-147 Payload テーブル全展開・全折りたたみ（P1）【完了】

開発者として、Payload テーブルの全ネスト要素を一斉に展開・折りたたみしたい。
なぜなら深いネスト構造を個別にクリックして開閉するのは手間がかかり、全体像の把握と詳細確認の切り替えを素早く行いたいから。

- 受け入れ基準
  - Given Payload テーブルが表示されている、When テーブルヘッダー付近の「全展開」ボタンをクリック、Then 全ネスト要素（depth に関わらず）が展開される … **OK**: ExpandTriggerContext でトリガー配信
  - Given 全ネスト要素が展開されている、When 「全折りたたみ」ボタンをクリック、Then depth 0 のみ表示され、それ以降は折りたたまれる … **OK**
  - Given 既存の行ごとの展開/折りたたみ、When 操作する、Then 従来どおり個別に動作する（全展開/折りたたみと共存） … **OK**

### US-148 AI 分析ログの所要時間リアルタイムカウント（P1）【完了】

開発者として、AI 分析の分析ログ横に表示される所要時間を、SSE イベント到着に依存せずリアルタイムにカウントアップさせたい。
なぜなら現状はイベント間でカウンタが停止し、処理がフリーズしているように見えるから。

- 受け入れ基準
  - Given AI 分析を実行中、When 分析ログのヘッダーを確認、Then 所要時間が 1 秒ごとにリアルタイムでカウントアップ表示される … **OK**: setInterval(1000)
  - Given 分析が完了した、When ログヘッダーを確認、Then カウントが停止し最終所要時間が固定表示される … **OK**
  - Given 分析中でないログを閲覧している（sessionStorage から復元）、When ログヘッダーを確認、Then 記録済みの最終所要時間が固定表示される … **OK**: elapsedMs を sessionStorage に保存・復元

### US-150 スキーマドリフトセクションの配置変更（P1）【完了】

開発者として、「スキーマドリフト」セクションを「AI 分析結果」の下に移動してほしい。
なぜなら調査ワークフローでは Payload を先に確認し、次に AI 分析結果を読むのが自然で、スキーマドリフトは補助的な情報であるため後方に置くほうが視線の流れに合うから。

- 受け入れ基準
  - Given 詳細画面を開く、When セクション順を確認、Then 「メタ情報 → Payload → AI 分析結果 → スキーマドリフト」の順で表示される … **OK**
  - Given スキーマドリフトが検出されていない Webhook、When 詳細を表示、Then スキーマドリフトセクション自体が非表示のまま（既存動作維持） … **OK**

### US-152 AI 分析ログの詳細情報拡充（P1）【完了】

開発者として、AI 分析ログにプロンプト全文・AI 回答全文・時刻（date）を表示し、ログ表示を自動スクロールさせたい。
なぜなら分析の内部動作を詳細に把握することで、プロンプト改善やモデル評価のフィードバックループを効率化したいから。

- 受け入れ基準
  - Given AI 分析を実行中、When 分析ログを確認、Then 各ステップの開始時刻（HH:MM:SS 形式）が行頭に表示される … **OK**: timestamp を SSE で送信
  - Given Step 1/2/3 の開始時、When ログを確認、Then LLM に送ったプロンプト全文が折りたたみ式で表示される … **OK**: CollapsibleBlock
  - Given Step 1/2/3 の完了時、When ログを確認、Then LLM の回答全文が折りたたみ式で表示される … **OK**
  - Given 分析中に新しいログが追加される、When ログ表示を確認、Then 自動的に最新行までスクロールされる … **OK**: scrollRef, useEffect
  - Given ユーザーがログを上にスクロールして過去のログを確認中、When 新しいログが追加される、Then 自動スクロールは一時停止し、ユーザーの閲覧を妨げない … **OK**: userScrolledUp

### US-151 Step 2 field_descriptions のフィールド欠落バグ修正（P0）【完了】

開発者として、AI 分析の Step 2 で一部のフィールド（hash 等）が field_descriptions から脱落するバグを修正したい。
なぜなら Step 1 の explanation では解説されているフィールドが Step 2 で消えると、Payload テーブルの説明列が歯抜けになり分析品質が低下するから。

- 受け入れ基準
  - Given Payload に hash フィールドがある Webhook で AI 分析を実行、When 分析完了、Then field_descriptions に hash の説明が含まれている … **OK**: プロンプト明確化 + フォールバック補完
  - Given Payload の全フィールドに対して、When Step 2 完了後の field_descriptions を確認、Then Payload のトップレベルキーがすべて含まれている … **OK**
  - Given Step 2 の結果にフィールドが不足していた場合、When フォールバック処理、Then 不足キーに対してデフォルト説明（Step 1 からの抽出または「不明」）が補完される … **OK**: _ensure_payload_keys_in_descriptions

## Phase 15: リアルタイム体験と分析ログの品質改善

### US-153 分析ログの Webhook 切替時リセットと全タイムスタンプ付与（P0）【完了】

開発者として、別の Webhook に切り替えたとき前の分析ログが残らず、全ログエントリにタイムスタンプが表示されてほしい。
なぜなら前の Webhook のログが混在すると調査の正確性を損ない、時刻がないログエントリは分析の進行状況を把握できないから。

- 受け入れ基準
  - Given Webhook A の分析ログが表示されている、When 左ペインで Webhook B を選択する、Then 分析ログがクリアされ Webhook B の状態のみが表示される … **OK**: id 変化時に setAnalysisLogs([])
  - Given AI 分析をストリーミング実行中、When 全ステップ（Evidence 完了、Step 1 完了/失敗、Step 2 完了/失敗、Step 3 完了/失敗、サニタイズ）のログが表示される、Then 全てのエントリに HH:mm:ss 形式のタイムスタンプが表示される … **OK**: ollama_analyzer の全 yield に timestamp 追加
  - Given sessionStorage に保存された分析ログがある、When 別の Webhook 詳細を開く、Then 前の Webhook のログが復元されない … **OK**: キーを webhook-analysis-logs-{id} に変更

### US-154 分析ログの表示領域拡大とプロンプト/回答デフォルト展開（P1）【完了】

開発者として、分析ログの表示領域がもっと広く、プロンプト全文と AI 回答全文がデフォルトで展開されていてほしい。
なぜなら現状の高さ制約（240px）では長い分析結果を確認しづらく、毎回手動で展開する操作が煩わしいから。

- 受け入れ基準
  - Given 分析ログが展開されている、When ログ本体を確認する、Then 最大高さが約 960px（現行の約 4 倍）でスクロール可能に表示される … **OK**: max-h-[960px]
  - Given 分析ログにプロンプト全文・AI 回答全文がある、When ログを開く、Then プロンプト全文・AI 回答全文がデフォルトで展開状態になっている … **OK**: CollapsibleBlock useState(true)
  - Given CollapsibleBlock（プロンプト/回答）が展開されている、When 長いテキストが含まれる、Then 最大高さ 512px 程度でスクロール可能に表示される … **OK**: max-h-[512px]

### US-155 INBOX ヘッダーの Webhook 受信 URL 表示（P1）【完了】

開発者として、INBOX パネルの上部に Webhook 受信エンドポイント URL が常に表示され、ワンクリックでコピーできてほしい。
なぜなら外部サービスの Webhook 送信先設定時に毎回 URL を覚えたり手入力したりするのが面倒だから。

- 受け入れ基準
  - Given INBOX パネルを表示している、When 上部の情報エリアを確認する、Then Webhook 受信 URL（例: `http://localhost:8000/api/webhooks/receive`）が表示されている … **OK**: window.location.origin + /api/webhooks/receive
  - Given Webhook 受信 URL が表示されている、When URL またはコピーアイコンをクリックする、Then クリップボードに URL がコピーされ、コピー完了のフィードバック（✓ 表示）が表示される … **OK**
  - Given 環境変数や設定で外部 URL（ngrok 等）が未設定の場合、When INBOX を表示する、Then ローカルの URL がデフォルトで表示される … **OK**: 同上

### US-156 WebSocket リアルタイム更新の修復と接続状態改善（P0）【完了】

開発者として、Webhook が着弾したら INBOX リストが自動で更新され、WebSocket 接続状態が正確に表示されてほしい。
なぜなら現状 Webhook が着弾しても一覧が更新されず、手動リロードが必要で調査効率が大幅に低下するから。

- 受け入れ基準
  - Given 2 ペイン画面を表示中、When 外部から Webhook が送信される、Then INBOX リストに新着 Webhook が自動で追加される（手動リロード不要） … **OK**: Vite proxy ws:true、新着時に page 1 に切り替え
  - Given WebSocket が切断された場合、When 自動再接続が行われる、Then 接続状態表示が「再接続中...」→「Live」に遷移し、再接続後も新着通知が正常に機能する … **OK**: status の reconnecting → connected
  - Given WebSocket が接続済み、When INBOX ヘッダーの接続状態を確認する、Then 「Live」と緑ドットが表示され、「Off」表示にはならない … **OK**: 接続中/再接続中/切断の状態を区別

### US-157 Payload テーブル「全展開」の全階層一括展開修正（P0）【完了】

開発者として、「全展開」ボタンを 1 回クリックしたら全階層が即座に展開されてほしい。
なぜなら現状は 1 階層ずつしか展開されず、深いネスト構造の Payload を確認するのに何度もクリックが必要で非効率だから。

- 受け入れ基準
  - Given 3 階層以上ネストした Payload がある、When 「全展開」ボタンをクリックする、Then 全階層が 1 回のクリックで同時に展開される … **OK**: useState 初期化子で triggers.expandAll をチェック
  - Given 全展開状態、When 「全折りたたみ」ボタンをクリックする、Then 全階層が即座に折りたたまれる … **OK**: 既存の collapseAll で対応
  - Given 全展開後に一部を手動で折りたたんだ状態、When 再度「全展開」をクリックする、Then 折りたたんだ部分も含めて全階層が展開される … **OK**: expandTrigger インクリメントで全ノードに useEffect 発火

### US-159 Payload テーブル全展開の再修正とデフォルト全展開（P0）【完了】

開発者として、Payload テーブルの「全展開」が全階層を確実に一括展開し、初期表示時にもデフォルトで全展開されてほしい。
なぜなら現状の US-157 修正では一部の階層が展開されないケースがあり、毎回手動で全展開ボタンを押す手間が発生するから。

- 受け入れ基準
  - Given 4 階層以上ネストした Payload がある、When 詳細画面を初回表示する、Then 全階層がデフォルトで展開された状態で表示される … **OK**: expandTrigger 初期値 1、defaultExpanded true
  - Given 全折りたたみ状態、When 「Expand All」ボタンをクリックする、Then 全階層（depth に関わらず）が 1 回のクリックで確実に展開される … **OK**
  - Given 全展開状態、When 「Collapse All」をクリックする、Then depth 0 のみ表示され、全階層が折りたたまれる … **OK**
  - Given 配列内にネストしたオブジェクトがある、When 全展開する、Then 配列の子要素内のネストも含めて全て展開される … **OK**

### US-166 個別 Webhook の PDF レポートエクスポート（P0）【完了】

開発者として、詳細ペインに表示中の Webhook を PDF レポートとしてエクスポートしたい。
なぜなら調査結果を社内共有やドキュメント化する際に、印刷可能な形式で出力したいから。

- 受け入れ基準
  - Given 詳細ペインで Webhook を表示中、When 「Export PDF」ボタンをクリックする、Then PDF ファイルが生成されダウンロードされる … **OK**: GET /webhooks/{id}/export/pdf、フロント Export PDF ボタン
  - Given 生成された PDF、When 内容を確認する、Then リクエスト情報（HTTP メソッド・ヘッダー・IP）、Payload 情報（整形済み JSON）、AI 分析結果（概要・個別解説・フィールド説明）が含まれている … **OK**: build_webhook_pdf
  - Given PDF のデザイン、When 確認する、Then Web UI のダークテーマを踏襲したカラーパレット・タイポグラフィで作成されている … **OK**: slate 系配色
  - Given AI 分析が未実行の Webhook、When PDF を出力する、Then AI 分析結果セクションは「Not analyzed」と表示され、エラーにならない … **OK**

### US-161 一覧ペインの表示件数拡大（500 件）（P1）【完了】

開発者として、一覧ペインに最大 500 件の Webhook を表示したい。
なぜなら現在の 50 件では調査対象の全体像が把握できず、ページ送りの手間が多いから。

- 受け入れ基準
  - Given 500 件以上の Webhook がある、When 一覧ペインを表示する、Then 1 ページあたり 500 件が表示される … **OK**: PAGE_SIZE=500
  - Given 500 件表示中、When スクロールする、Then パフォーマンスの問題なくスムーズにスクロールできる … **OK**
  - Given 500 件を超えるデータがある、When ページ操作する、Then 次ページで残りが表示される … **OK**

### US-165 UI ボタンラベルの英語統一（P1）【完了】

開発者として、操作ボタンのラベルを英語に統一したい。
なぜならデータが英語であるため、ボタンも英語のほうが自然で、コードとの一貫性も保てるから。

- 受け入れ基準
  - Given Payload テーブル、When ボタンを確認する、Then 「全展開」→「Expand All」、「全折りたたみ」→「Collapse All」、「保存」→「Save」、「キャンセル」→「Cancel」と英語で表示される … **OK**
  - Given 詳細ペインの遷移ボタン、When 確認する、Then 「← 前へ」→「← Prev」、「次へ →」→「Next →」と英語で表示される … **OK**
  - Given 一覧ペインのページネーション、When 確認する、Then 「前」→「Prev」、「次」→「Next」と英語で表示される … **OK**
  - Given 詳細ペインの再送ボタン、When 確認する、Then 「再送」→「Replay」、「送信」→「Send」、「送信中...」→「Sending...」と英語で表示される … **OK**
  - Given AI 分析ボタン、When 確認する、Then 「AI で分析」→「Analyze」、「再分析を実行」→「Re-analyze」、「分析中...」→「Analyzing...」と英語で表示される … **OK**
  - Given マスキングチェックボックス、When 確認する、Then 「機密情報をマスク」→「Mask Sensitive Data」と英語で表示される … **OK**

### US-158 Payload 表示モード切替（テーブル / JSON 生データ）（P1）【完了】

開発者として、Payload セクションでテーブル表示と JSON 生データ表示（インデント整形済み）を切り替えたい。
なぜなら構造を把握するにはテーブルが便利だが、API 連携やドキュメント作成時には JSON をそのままコピーしたいから。

- 受け入れ基準
  - Given Payload セクションが表示されている、When 「Table」/「JSON」タブを切り替える、Then テーブル表示と JSON 生データ表示が切り替わる … **OK**
  - Given JSON 表示モード、When JSON を確認する、Then インデント整形済み（2 スペース）の JSON が表示される … **OK**
  - Given JSON 表示モード、When コピーボタンをクリックする、Then JSON 全文がクリップボードにコピーされ、コピー完了フィードバック（✓ Copied）が表示される … **OK**
  - Given テーブル表示モード、When 確認する、Then 既存の PayloadTable 機能（展開/折りたたみ、辞書説明、マスキング等）が正常に動作する … **OK**

### US-160 一覧ペインの未読エントリハイライトと既読管理（P1）【完了】

開発者として、一覧ペインで未読（未選択）の Webhook エントリを視覚的に区別し、選択時に自動で既読にしたい。
なぜなら 500 件表示の中からまだ確認していないエントリを素早く見つけたいから。

- 受け入れ基準
  - Given 新規 Webhook が受信された、When 一覧ペインを確認する、Then 未読エントリが太字テキストと左端のアクセントバーで視覚的に強調される … **OK**
  - Given 未読エントリをクリックする、When 詳細ペインに表示される、Then そのエントリが自動的に既読に変わり、太字とアクセントバーが解除される … **OK**
  - Given 既読/未読状態、When ブラウザをリロードする、Then 状態が DB に永続化されているため維持される … **OK**
  - Given 全エントリが既読の状態で新規 Webhook が着弾する、When 一覧を確認する、Then 新着エントリのみ未読として表示される … **OK**

### US-163 event_type フィルタのプルダウン選択肢表示（P1）【完了】

開発者として、event_type フィルタにも source と同じくプルダウン選択肢を表示したい。
なぜなら event_type の正確な名前を覚えていなくても選択できるようにしたいから。

- 受け入れ基準
  - Given 一覧ペインの event_type フィルタ、When フォーカスする、Then 受信済み event_type の一覧がプルダウンで表示される … **OK**: getStats().by_event_type
  - Given プルダウンに候補がある、When テキストを入力する、Then 入力文字列で候補がフィルタリングされる … **OK**
  - Given プルダウンの候補をクリックする、When 選択する、Then event_type フィルタに反映される … **OK**
  - Given フィルタにテキストを直接入力する、When 部分一致で検索する、Then テキスト入力による検索も引き続き機能する … **OK**

### US-164 フィルタ入力のインクリメンタルサーチ（P1）【完了】

開発者として、source / event_type フィルタに 1 文字入力するごとに一覧の検索結果がダイナミックに更新されてほしい。
なぜなら Enter キーを押したり値を選択したりする前に、候補を絞り込んで素早く目的のエントリを見つけたいから。

- 受け入れ基準
  - Given source フィルタにテキストを入力する、When 1 文字入力するごと、Then 300ms 程度のデバウンスの後、一覧が自動的にフィルタリングされる … **OK**: useDebounce 300ms
  - Given event_type フィルタにテキストを入力する、When 1 文字入力するごと、Then 同様にデバウンス後に一覧が自動更新される … **OK**
  - Given 高速にタイプする、When デバウンス中に次の文字が入力される、Then 最後の入力から 300ms 後にのみ API が呼ばれ、不要なリクエストが抑制される … **OK**
  - Given フィルタをクリアする、When 入力欄を空にする、Then 全件表示に戻る … **OK**

### US-162 INBOX ヘッダーのサービス接続状況表示（P1）【完了】

開発者として、INBOX ヘッダーに各サービスの接続状況（公開 URL / ローカル API / PostgreSQL / Ollama）を一目で確認したい。
なぜなら Webhook 調査の前提となるサービス稼働状況をブラウザ上で即座に把握したいから。

- 受け入れ基準
  - Given INBOX ヘッダーを表示する、When 確認する、Then 以下 4 項目が縦並びで接続状況とともに表示される: (1) 公開 URL（ngrok 等）と Live / Offline ステータス (2) ローカル API（localhost:8000）と Live / Offline ステータス (3) PostgreSQL プロセス稼働状況（Live / Offline） (4) Ollama プロセス稼働状況（Live / Offline） … **OK**: ServiceStatusPanel
  - Given ngrok が起動している、When バックエンドが ngrok API（`http://localhost:4040/api/tunnels`）を自動検出する、Then 公開 URL と「Live」が緑ドットで表示される … **OK**
  - Given ngrok が未起動、When 検出を試みる、Then 「Offline」がグレードットで表示される … **OK**
  - Given いずれかのサービスがダウンした、When ステータスが変わる、Then 定期ポーリング（30 秒間隔）で状態が更新される … **OK**: setInterval 30s

### US-167 一括既読操作と未読フィルタ（P2）【完了】

開発者として、複数の未読エントリを一括で既読にし、未読のみをフィルタリングしたい。
なぜなら 500 件表示で未読が大量にある場合、1 件ずつ開くのは非効率だから。

- 受け入れ基準
  - Given 一覧ペインに未読エントリがある、When 「Mark All Read」ボタンをクリックする、Then 現在のフィルタ条件に一致する全エントリが既読に変更される … **OK**: POST /mark-all-read
  - Given 一覧ペイン、When 「Unread Only」フィルタを有効にする、Then 未読エントリだけが表示される … **OK**: listWebhooks is_read=false
  - Given 全て既読にした後、When フィルタを解除する、Then 全エントリが通常表示に戻る … **OK**

### US-171 PDF AI 分析結果の出力修正（P0）【完了】

開発者として、AI 分析済みの Webhook を PDF 出力した際に分析結果（Summary / Explanation / Field Descriptions）が正しく含まれてほしい。
なぜなら現状 AI 分析済みでも「Not analyzed」と出力されるケースがあり、レポートとしての価値が損なわれるから。

- 受け入れ基準
  - Given AI 分析済みの Webhook を PDF エクスポートする、When AI Analysis セクションを確認する、Then Summary・Explanation・Field Descriptions が正しく出力される … **OK**
  - Given 定義ファイルからのキャッシュ読み込み（US-126）で分析結果が表示されている Webhook、When PDF 出力する、Then 定義ファイルベースの結果も PDF に反映される … **OK**: load_analysis_from_yaml フォールバック
  - Given AI 分析が未実行の Webhook、When PDF 出力する、Then 「Not analyzed」と表示されエラーにならない（既存動作維持） … **OK**

### US-172 未読エントリの恒久的背景ハイライト強化（P0）【完了】

開発者として、一覧ペインの未読エントリが既読になるまで恒久的に明るい背景色と太字で表示されてほしい。
なぜなら現状の左端アクセントバーと太字のみでは 500 件表示の中で未読を見落としやすいから。

- 受け入れ基準
  - Given 未読の Webhook エントリ、When 一覧ペインを確認する、Then 既読エントリより明るい背景色（例: `bg-blue-50/50 dark:bg-blue-900/20`）と太字テキストで恒久的に表示される … **OK**: bg-blue-50/60 dark:bg-blue-900/25
  - Given 未読エントリをクリックして既読にする、When 一覧に戻る、Then 背景色が通常に戻り太字が解除される … **OK**
  - Given 新着 Webhook が WebSocket で到着する、When 一覧を確認する、Then 新着エントリも未読として恒久的にハイライトされる（数秒で消えない） … **OK**
  - Given 選択中の未読エントリ、When 確認する、Then 選択状態のスタイルが優先される（背景色の競合なし） … **OK**: isSelected が先に評価

### US-168 ServiceStatusPanel の表形式化と UX 改善（P1）【完了】

開発者として、サービス接続状況を表形式で整列表示し、URL をワンクリックでコピーしたい。
なぜなら現状のテキスト羅列では URL が切れて読みにくく、コピー操作も手間がかかるから。

- 受け入れ基準
  - Given INBOX ヘッダーを表示する、When ServiceStatusPanel を確認する、Then 5 行（Public / Local / Backend / DB / LLM）が表形式（ラベル・URL・ステータス）で整列表示される … **OK**
  - Given 各行の URL 部分、When クリックする、Then クリップボードに URL がコピーされコピー完了フィードバック（✓）が表示される … **OK**: CopyableUrl
  - Given ステータスが Live のサービス、When 確認する、Then 「live」の文字が緑色で表示され、左隣に緑色の丸（StatusDot）が表示される … **OK**
  - Given ステータスが Offline のサービス、When 確認する、Then 「offline」の文字が灰色で表示され、灰色の丸が表示される … **OK**
  - Given フォントサイズ、When 確認する、Then 現行（10px）より拡大された text-xs（12px）で表示される … **OK**

### US-169 PDF Payload のテーブル形式表示（P1）【完了】

開発者として、PDF の Payload セクションを Web UI と同様の Table 形式（key / value / type / description）で出力したい。
なぜなら JSON 生データでは構造の把握が難しく、レポートとしての可読性が低いから。

- 受け入れ基準
  - Given Payload がある Webhook の PDF をエクスポートする、When Payload セクションを確認する、Then key / value / type / description の 4 カラムテーブル形式で表示される … **OK**: _flatten_payload
  - Given ネストされたオブジェクトがある、When テーブルを確認する、Then ドット記法（例: `data.hash`）でフラットにキーが展開される … **OK**
  - Given AI 分析結果の field_descriptions がある、When description 列を確認する、Then 対応するフィールドの説明が表示される … **OK**
  - Given 長い値（64 文字超）がある、When テーブルを確認する、Then 値が折り返し表示され省略されない … **OK**: 500 文字まで表示、WORDWRAP

### US-170 PDF ヘッダー・フッターメタデータの追加（P1）【完了】

開発者として、PDF レポートにインデックス番号・出力日時・ページ番号などのメタデータを含めたい。
なぜなら印刷時や複数レポートの照合時に識別情報が必要だから。

- 受け入れ基準
  - Given PDF を生成する、When ヘッダーを確認する、Then 「Webhook Report #NNN」（インデックス番号）と出力日時（YYYY/MM/DD HH:MM:SS）が表示される … **OK**: NumberedCanvas
  - Given 複数ページにわたる PDF、When フッターを確認する、Then 「Page X / Y」形式のページ番号が表示される … **OK**
  - Given 1 ページの PDF、When フッターを確認する、Then ページ番号「Page 1 / 1」が表示される … **OK**

### US-173 受信日時書式の統一（YYYY/MM/DD HH:MM:SS）（P1）【完了】

開発者として、一覧ペイン・詳細ペイン・その他全画面で受信日時を `YYYY/MM/DD HH:MM:SS` 形式で統一表示したい。
なぜなら現状の `toLocaleString()` はブラウザ依存で書式が不安定であり、ゼロパディングされないケースがあるから。

- 受け入れ基準
  - Given 一覧ペインの Webhook エントリ、When 日時を確認する、Then 「2026/03/01 16:46:49」形式（ゼロパディング済み）で表示される … **OK**: formatReceivedAt
  - Given 詳細ペインのメタ情報、When received_at を確認する、Then 同じ書式で表示される … **OK**
  - Given event_type 別・比較・スキーマ推定ページ、When 日時を確認する、Then 全て同一書式で表示される … **OK**

### US-174 詳細ペインナビゲーションバーの位置調整（P1）【完了】

開発者として、Prev / Next / Replay / Export PDF のナビゲーションバーをタブバー直下（詳細ペイン上枠すぐ下）に固定配置したい。
なぜなら現状はスクロールでボタンが見えなくなり、長い Payload を確認中に前後遷移するためにスクロールバックが必要だから。

- 受け入れ基準
  - Given 詳細ペインを表示する、When ナビゲーションバーを確認する、Then タブバー（詳細 / event_type別 / スキーマ / 比較）の直下に固定配置されている … **OK**: DetailNavBar を TwoPanePage のタブ直下に配置
  - Given 詳細ペインをスクロールする、When 下までスクロールする、Then ナビゲーションバーはスクロールに追従せず上部に固定されたまま … **OK**: shrink-0 でスクロール領域外
  - Given ナビゲーションバー、When 確認する、Then Prev / Next / Replay / Export PDF / #NNN が既存と同じ機能で表示される … **OK**

### US-175 source / event_type フィルタの相互連動（P1）【完了】

開発者として、source を選択したら event_type の候補がそのソースに存在するものに絞られ、逆に event_type を選択したら source 候補も絞られてほしい。
なぜなら現状は全候補が常に表示されるため、存在しない組み合わせを選んでしまい空結果になることがあるから。

- 受け入れ基準
  - Given source に「bitgo」を選択する、When event_type プルダウンを開く、Then bitgo の Webhook に存在する event_type のみが候補として表示される … **OK**: GET /filter-options?source=bitgo
  - Given event_type に「transfer」を選択する、When source プルダウンを開く、Then transfer イベントを持つ source のみが候補として表示される … **OK**: GET /filter-options?event_type=transfer
  - Given source も event_type もクリアする、When プルダウンを開く、Then 全候補が表示される（既存動作）… **OK**
  - Given source を選択後に event_type を選択、When source をクリアする、Then event_type 候補が全件に戻る … **OK**

### Phase 18: INBOX ヘッダー簡素化

### US-176 INBOX ヘッダーの簡素化と URL 全文表示（P1）【完了】

Web3エンジニアとして、INBOX ヘッダー領域の不要な UI 要素を削減し、
サービス接続状況の URL を省略なく確認したい。
なぜなら、受信 URL のコピーボタンは利用頻度が低く画面を圧迫しており、
テーブルヘッダーも自明な情報で冗長であり、
URL の切り詰めは接続先の判別を困難にするから。

- 受け入れ基準
  - Given INBOX 一覧ペインが表示されている、When ヘッダー領域を確認する、Then Webhook 受信 URL 表示バー（コピーボタン付き）が表示されていない … **OK**: URL バー削除済み
  - Given サービス接続状況パネルが表示されている、When テーブルを確認する、Then "Label" / "URL" / "Status" のカラムヘッダー行が表示されていない … **OK**: thead 削除済み
  - Given サービス接続状況パネルが表示されている、When 各行の URL を確認する、Then パネル幅に収まる範囲で URL が全文表示されている（幅が不足する場合のみ末尾省略される）… **OK**: max-w-[140px] 制約を削除

### Phase 19: サービスステータスの表示改善とヘルスチェック信頼性向上

### US-177 ServiceStatusPanel の 2列ラベル化とコンパクト表示（P1）【完了】

Web3 エンジニアとして、サービス接続状況パネルを一目で把握したい。
なぜなら現状の Label 列では「どのインフラ部位の、どのコンポーネントか」が不明瞭で、Backend と Local の重複も紛らわしいから。

- 受け入れ基準
  - Given パネルが表示されている、When 各行を確認する、Then Part 列（Public/Local/WEB/DB/LLM）と Component 列（ngrok/Uvicorn/Vite/PostgreSQL/Ollama）の 2列で表示され、ステータスは絵文字（🟢/⚫）のみで表現されている … **OK**
  - Given パネルが表示されている、When DB・LLM の URL 列を確認する、Then Docker 内部名（`db:5432`, `ollama:11434`）ではなくホストから到達可能な `http://localhost:PORT` 形式で表示されている … **OK**
  - Given パネルが表示されている、When WEB 行を確認する、Then Vite の稼働状況が Live/Offline で表示され URL は `http://localhost:5173` である … **OK**

### US-178 ヘルスチェックの信頼性向上（P1）【完了】

Web3 エンジニアとして、各サービスの稼働状況をより正確に把握したい。
なぜなら現状は「API が応答するか」の表面的なチェックのみで、モデル未ロードやトンネル不通といった実運用上の障害を検知できないから。

- 受け入れ基準
  - Given Ollama API は起動しているがモデル `gemma3:4b` が未ロードである、When パネルを確認する、Then LLM 行のステータスが Offline（⚫）で表示され、ホバー時に「model not loaded」等の理由が表示される … **OK**: /api/tags の models にモデルが含まれるか確認
  - Given 各サービスがすべて Live である、When パネルを確認する、Then 各行にレイテンシ（例: `12ms`）が表示され、パネル下部に「最終確認: Xs前」が表示される … **OK**
  - Given ngrok トンネルは存在するが公開 URL への外部到達が不可能である、When パネルを確認する、Then Public 行のステータスが Offline（⚫）で表示される … **OK**: 公開 URL への HEAD リクエストで E2E 疎通確認
  - Given いずれかのサービスが Offline である、When 絵文字にホバーする、Then エラー理由（接続拒否/タイムアウト等）がツールチップで表示される … **OK**

## Phase 20: お気に入り管理

### US-179 お気に入りマークとお気に入りフィルタ（P0）【完了】

Web3 エンジニアとして、一覧ペインの各エントリにお気に入りマーク（星アイコン）を付け、お気に入りだけを絞り込むフィルタを使いたい。
なぜなら数百件の Webhook の中から注目しているエントリを素早く見つけたく、調査対象を限定したいから。

- 受け入れ基準
  - Given 一覧ペインに Webhook エントリが表示されている、When エントリの星アイコン（☆）をクリックする、Then お気に入り状態がトグルされ、星が塗りつぶし（★）に変わる … **OK**: 星ボタンクリックで toggleWebhookFavorite、即時 UI 更新
  - Given お気に入りに設定したエントリがある、When 「Favorites Only」チェックボックスを有効にする、Then お気に入りマークされたエントリだけが一覧に表示される … **OK**: is_favorite=true で API フィルタ、一覧更新
  - Given お気に入り状態を変更した、When ブラウザをリロードする、Then お気に入り状態が DB に永続化されているため維持される … **OK**: is_favorite カラム永続化、一覧レスポンスに含む
  - Given 「Favorites Only」フィルタ ON で該当エントリが 0 件の場合、When 一覧を確認する、Then 適切な空状態メッセージ（「No favorites yet」等）が表示される … **OK**

## Phase 21: Unknown Webhook 自動分類

### US-180 Fireblocks Notifications 形式の自動分類（P1）【完了】

Web3エンジニアとして、Fireblocks の Notifications 形式（category/subject/eventKey を使うフォーマット）の Webhook を受信時に自動的に正しい source / event_type で分類したい。
なぜなら、現在これらが unknown/unknown として保存され、フィルタ・検索・定義ファイル連携が効かず、調査効率が大幅に低下するから。

- 受け入れ基準
  - Given Fireblocks Notifications 形式のペイロード（`category`, `subject`, `eventKey` フィールドを持つ）が送信されたとき、When `/api/webhooks/receive` で受信すると、Then `source="fireblocks"`、`event_type="{eventKey}.{event を小文字化}"`（例: `transaction.submitted`）、`group_key="fireblocks:{event_type}"` で保存される … **OK**: classifier に category/subject/eventKey/event の検出を追加、eventKey.event.lower() で event_type を導出
  - Given `category`/`subject`/`eventKey` を持たない未知のペイロードが送信されたとき、When `/api/webhooks/receive` で受信すると、Then 従来通り `source="unknown"`、`event_type="unknown"` で分類される（既存ルールへの副作用なし） … **OK**: 既存 unknown テストが通過

### US-181 AI 分析時の unknown ソース自動再分類（P1）【完了】

Web3エンジニアとして、`unknown/unknown` として保存された Webhook を AI 分析実行時に自動的にソースとイベントタイプを推定・再分類してほしい。
なぜなら、classifier のルールに未登録の新しいサービスや形式の Webhook でも、AI の推論力で正しいグループに分類でき、定義ファイル連携や検索性が向上するから。

- 受け入れ基準
  - Given `source="unknown"` の Webhook が存在するとき、When AI 分析を実行すると、Then LLM がペイロードから source と event_type を推定し、Webhook レコードの `source` / `event_type` / `group_key` が更新される … **OK**: 推論ステップ追加、分析成功時に Webhook 更新
  - Given AI が source/event_type を推定できなかったとき、When 分析が完了すると、Then source/event_type は "unknown" のまま維持され、分析結果（summary / field_descriptions）は正常に保存される … **OK**: 推論失敗時は既存のまま、分析結果は保存
  - Given `source="unknown"` でない（既に分類済みの）Webhook のとき、When AI 分析を実行すると、Then 既存の `source` / `event_type` / `group_key` は変更されない … **OK**: 既知 Webhook は推論結果を適用しない

### US-182 既存 unknown Webhook のルールベース一括再分類（P0）【完了】

Web3エンジニアとして、classifier ルール追加前に受信された `unknown/unknown` の Webhook を一括で再分類したい。
なぜなら、ルール追加後も過去の unknown はそのまま残っており、フィルタ・検索・定義ファイル連携が効かないから。

- 受け入れ基準
  - Given `source="unknown"` の Webhook が複数存在するとき、When `POST /api/webhooks/reclassify` を実行すると、Then 各 Webhook の payload に対して最新の classifier ルールが再適用され、マッチしたものは `source` / `event_type` / `group_key` が更新される。レスポンスには `total`（対象件数）、`reclassified`（更新件数）、`unchanged`（unknown のまま）が返される … **OK**: reclassify エンドポイント実装、classifier 再適用で更新
  - Given 全ての unknown Webhook が現行の classifier ルールにマッチしない場合、When 再分類を実行すると、Then 全件 `unchanged` として返され、既存データに副作用がない … **OK**: マッチしなければ更新なし

### US-183 unknown Webhook の UI 再分類ボタン（P0）【完了】

Web3エンジニアとして、unknown のまま残っている Webhook をフロントエンドから再分類したい。
なぜなら、classifier ルール追加後に過去の unknown を手動で curl する運用は非効率だから。

- 受け入れ基準
  - Given INBOX に `source="unknown"` の Webhook が 1 件以上あるとき、When INBOX ヘッダーを確認すると、Then「Reclassify All」ボタンが表示される。クリックすると一括再分類が実行され、一覧がリロードされる … **OK**: WebhookListPane に Reclassify All ボタン追加、unknown がある場合のみ表示
  - Given 詳細ペインで `source="unknown"` の Webhook を表示しているとき、When ナビバーを確認すると、Then「Reclassify」ボタンが表示される。クリックすると当該 Webhook のみ再分類され、詳細表示が更新される … **OK**: DetailNavBar に個別 Reclassify ボタン追加、POST /{id}/reclassify API 新設
  - Given `source="unknown"` の Webhook が 0 件のとき、When INBOX ヘッダーを確認すると、Then「Reclassify All」ボタンは非表示になる … **OK**: items.some(w => w.source === "unknown") で条件表示
  - Given 詳細ペインで `source` が "unknown" でない Webhook を表示しているとき、When ナビバーを確認すると、Then「Reclassify」ボタンは表示されない … **OK**: webhook.source === "unknown" で条件表示

### US-184 Fireblocks Notifications 分類の eventKey 依存除去（P0）【完了】

Web3エンジニアとして、Fireblocks の Administration 系通知（Webhooks Notification 等）も正しく分類されてほしい。
なぜなら、`eventKey` が存在しないカテゴリの Webhook が unknown のまま残り、フィルタ・検索・調査効率が低下するから。

- 受け入れ基準
  - Given `category`/`subject`/`event` を持つが `eventKey` を持たない Fireblocks ペイロード（例: `subject: "Webhooks Notification"`, `event: "Created"`）が送信されたとき、When 受信すると、Then `source="fireblocks"`、`event_type="webhooks_notification.created"` で分類される … **OK**: classifier の条件から eventKey を除去、subject を正規化して event_type を導出
  - Given `eventKey` を持つ従来の Fireblocks Notifications ペイロード（例: `subject: "Transaction"`, `event: "Submitted"`）が送信されたとき、When 受信すると、Then 従来と同じ `event_type="transaction.submitted"` で分類される（後方互換） … **OK**: subject="Transaction" → normalized="transaction" で同一結果
  - Given 詳細ペインで unknown Webhook の Reclassify ボタンを押したとき、When 再分類の結果 unchanged であっても、Then「No rules matched」等のフィードバックが表示される … **OK**: reclassifyMsg state で結果を表示

## Phase 22: UI 操作性改善

### US-185 フィルタクリアボタンと分析スピナー視認性改善（P1）【完了】

Web3エンジニアとして、フィルタ入力欄をワンタップでクリアでき、AI 分析中のスピナーが明確に回転していることを視認したい。
なぜなら、フィルタのクリアにドロップダウンを開く手間がかかり、スピナーが見えないと分析中かどうか判断に迷うから。

- 受け入れ基準
  - Given source / event_type / 全文検索のいずれかに文字が入力されているとき、When 入力欄を確認すると、Then 右端に x（クリア）ボタンが表示され、押下すると入力がクリアされる … **OK**: 3 箇所の input に条件付き x ボタン追加、クリック時に値をリセット
  - Given 入力欄が空のとき、When 確認すると、Then クリアボタンは非表示 … **OK**: `{value && (<button>x</button>)}` で条件表示
  - Given AI 分析中（Analyzing...）のとき、When ボタンを確認すると、Then スピナーの回転が明確に視認できる（ダークモードでもコントラスト十分） … **OK**: border 色を slate-400 から indigo-400/indigo-300 に変更

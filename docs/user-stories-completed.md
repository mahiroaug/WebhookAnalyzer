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

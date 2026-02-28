# スプリントログ

ストーリーの完了記録と振り返りを蓄積する。

---

## Sprint 1（2026-02-28）

### 完了ストーリー

| ID | タイトル | 受け入れ結果 | 備考 |
|----|---------|-------------|------|
| US-001 | 受信一覧の即時可視化 | OK | 一覧はAPIで最新順、行クリックで詳細遷移を実装 |
| US-002 | 絞り込みによるノイズ削減 | OK | source/event_type フィルタが既存実装で成立 |
| US-003 | ページングで大量データを安定閲覧 | OK | API limit/offset、items+total 形式、前へ/次へUI を実装 |
| US-004 | 状態別UI（読み込み/空/エラー）の明確化 | OK | スケルトン行、空説明+CTA、エラー帯+再試行ボタン |
| US-005 | 詳細情報の一画面集約 | OK | source/event_type/group_key/received_at をメタ情報として表示 |
| US-006 | Payload JSONの要素分解表示 | OK | JsonTreeView で展開/折りたたみ、型表示、コピー・JSONPath コピー |
| US-007 | 重要フィールドの視認性向上 | OK | id/amount/status 等をハイライト、欠損時は警告表示 |
| US-008 | フィールドごとのAI解説 | OK | 既存実装で成立（要約・フィールド別説明表示） |
| US-009 | AI分析失敗時の回復導線 | OK | 失敗時は赤帯で理由表示、再分析ボタン、API失敗は再試行ボタン |
| US-010 | 分析ステータスの一覧可視化 | OK | 一覧に分析済/未を表示、フィルタで未分析のみ表示可能 |
| US-011 | リアルタイム受信反映 | OK | WebSocket /ws、受信時ブロードキャスト、自動再接続・再接続ボタン |
| US-012 | 比較ビュー | OK | 一覧で複数選択→比較画面、差分フィールド強調表示 |
| US-013 | 保存ビュー/共有リンク | OK | フィルタをURLに反映、共有リンクコピーで同条件を再現 |
| US-014 | event_type別の網羅一覧 | OK | GET /grouped-by-event-type、件数・代表例・新規タイプ表示 |
| US-015 | ペイロード構造のスキーマ自動推定 | OK | GET /schema/estimate、共通フィールド・型・出現率・必須/任意 |
| US-016 | 調査レポートのエクスポート | OK | GET /report/markdown、要約・フィールド説明・スキーマ・サンプル |
| US-017 | 一括AI分析 | OK | POST /batch-analyze、一覧の一括分析ボタン、完了/失敗件数表示 |
| US-018 | 調査セッション管理 | OK | セッションCRUD、Webhook紐づけ、セッション絞り込み |

### 持ち越し

| ID | 未達基準 | 理由 |
|----|---------|------|

### 振り返りメモ

- US-001: APIは既に `received_at.desc()` でソート済み。一覧に ID/Source/EventType/受信日時 を表示。行全体をクリック可能にし、`useNavigate` で詳細画面へ遷移するよう改善。
- US-003: 一覧APIを `{ items, total }` 形式に変更。limit=20/offset でページング。前へ/次へボタンで連続閲覧可能。
- US-004: ローディングはスケルトン5行+animate-pulse。空状態は説明文+フィルタ解除/再読み込みCTA。エラーは赤帯+再試行ボタン。
- US-005: 詳細画面にメタ情報（source/event_type/group_key/received_at）を定義リストで表示。
- US-006: JsonTreeView コンポーネント作成。展開/折りたたみ、キー・型・値、値コピー・JSONPath コピーを実装。
- US-007: 重要キー（id/amount/status 等）をハイライト。重要キーが1件以上ある場合、未検出の重要キーを警告表示。
- US-009: 分析失敗時（summary "[分析失敗]"）は赤帯で表示し「再分析を実行」ボタン。API呼び出し失敗時は analyzeError で「再試行」。
- US-010: 一覧APIに analyzed フィールド追加、analyzed クエリでフィルタ。一覧に「済/未」バッジ、セレクトで未分析のみ表示。
- US-011: WebSocket /api/webhooks/ws エンドポイント追加。receive 時に broadcast。useWebhookWebSocket フックで自動再接続・再接続ボタン。
- US-014: GET /webhooks/grouped-by-event-type。event_type 別に件数・代表例。unknown は「新規タイプ」バッジ。
- US-015: GET /webhooks/schema/estimate?event_type=。3件以上で推定。共通フィールド・型・出現率。必須=100%、任意<100%。event_type別ページに「スキーマ推定」リンク。
- US-016: GET /webhooks/report/markdown。分析済みを source/event_type 別に要約・フィールド説明・スキーマ・サンプルペイロードで出力。一覧に「レポート出力」リンク。
- US-019: フィールド辞書テンプレート（Fireblocks/BitGo）を app/services/field_templates.py に定義。GET /webhooks/field-templates API、詳細画面での辞書表示、未知フィールドの「未知」バッジ、AI分析へのテンプレート補助情報反映。
- US-020: スキーマドリフト検知。受信時に同 event_type の基準スキーマと比較し schema_drift を保存。一覧にドリフトバッジ・フィルタ、詳細に追加/削除/型変更の表示。

---

## Sprint 2（2026-02-28）Phase 6: デザイン刷新

### 完了ストーリー

| ID | タイトル | 受け入れ結果 | 備考 |
|----|---------|-------------|------|
| US-101 | グローバルレイアウトとナビゲーションの統一 | OK | Layout コンポーネント、共通ヘッダー、NavLink でアクティブ表示、SPA 遷移 |
| US-102 | DIMカラーテーマの適用 | OK | PolygonScan 風 #12161C 背景、#E4E6EA テキスト、blue-400 アクセント、index.css 整理 |
| US-108 | コピー/JSONPathコピーの修正とフィードバック | OK | アイコン化、成功時チェックマーク1秒、execCommand フォールバック |
| US-103 | ダークモード手動トグル | OK | useDarkMode、localStorage 保存、OS 初回追従、ヘッダーに Sun/Moon トグル |
| US-104 | タイポグラフィとスペーシングの統一 | OK | SF Pro + Hiragino + Noto Sans JP、line-height 1.5 |
| US-105 | テーブル・カード・ボタンのコンポーネント洗練 | OK | 行ホバー bg-slate-800/40、ボーダー半透明 |
| US-107 | 新着Webhookのリアルタイム挿入通知 | OK | framer-motion スライドイン、ハイライト3秒、効果音、ミュートボタン |
| US-109 | JSONビューアのインタラクションをモダン化 | OK | ホバー時のみアイコン表示、Clipboard/Path/Check アイコン |
| US-110 | 詳細画面の前後エントリ遷移 | OK | GET /webhooks/{id}/adjacent、前へ/次へボタン、矢印キーショートカット |
| US-106 | JSONビューアのデザイン改善 | OK | キー #D4A574、文字列 #9FDFBF、数値薄青、展開/折りたたみアニメーション |

---

## Sprint 3（2026-02-28）Phase 7: 開発ツール UX 刷新

### 完了ストーリー

| ID | タイトル | 受け入れ結果 | 備考 |
|----|---------|-------------|------|
| US-114 | AI 分析エラーのレジリエンス強化 | OK | trigger_analyze に try/except、ollama_analyzer.py の response.message を安全化、exc_info ログ追加 |
| US-113 | 受信順グローバルインデックス | OK | webhooks.sequence_index カラム追加、受信時に max+1 で採番、一覧・詳細に含める |
| US-116 | HTTP リクエストメタデータの保存と表示 | OK | http_method/remote_ip/request_headers カラム追加、receive 時に記録、一覧・詳細に含める |
| US-111 | webhook.site 風 2ペインレイアウト | OK | TwoPanePage、WebhookListPane、右ペインタブ切替、URLベースルーティング |
| US-112 | Payload 表形式表示とフィールド辞書統合 | OK | PayloadTable コンポーネント、辞書・AI 説明の統合列、入れ子テーブル、未知バッジ |
| US-115 | 詳細画面セクション順序の最適化 | OK | メタ→ドリフト→Payload→分析結果→分析ボタン、辞書セクション統合削除 |
| US-117 | ペインリサイズとレスポンシブ対応 | OK | ドラッグリサイズハンドル、localStorage 幅保存、min/max 制約 |
| US-118 | 詳細画面のアコーディオンセクション | OK | AccordionSection、開閉アニメーション、状態 localStorage 保存、HTTPメタ表示 |

---

## Sprint 4（2026-02-28）Phase 8: UI バグ修正と検索強化

### 完了ストーリー

| ID | タイトル | 受け入れ結果 | 備考 |
|----|---------|-------------|------|
| US-119 | 一覧ペインの UI バグ修正と source アイコン表示 | OK | フィルタ縦積み、source プルダウン、SourceIcon（fireblocks/bitgo/alchemy/quicknode+ジェネリック）、py-1.5 行 |
| US-120 | 詳細ペインの UI バグ修正とボタン改善 | OK | RequestHeadersDetails 開閉維持、再分析 1 箇所、ゴーストボタン、Payload 表 colgroup・文字列クォート除去 |
| US-121 | AI 分析の JSON パース堅牢化 | OK | プレーンテキスト→「LLM 出力が JSON ではありません」、parsed非dict→「不正な応答形式」、raw 500chars ログ、summary のみ許容 |
| US-122 | Payload 全文検索と検索結果一覧モード | OK | ヘッダー検索欄、API q パラメータ（ILIKE）、0件時「該当する Webhook がありません」 |
| US-123 | グローバルヘッダーのホームリンク | OK | ロゴを Link to="/" に、クリックで初期状態へ |
| US-124 | フィールド辞書の YAML 定義ファイル化 | OK | definitions/ 優先読み込み、migrate_field_templates_to_yaml.py、PyYAML |
| US-125 | AI 分析成功時の定義ファイル自動書き出し | OK | write_analysis_to_yaml、マージ、ai_generated |
| US-126 | 定義ファイルからの分析結果キャッシュ読み込み | OK | load_analysis_from_yaml、get_analysis フォールバック、from_definition_file バッジ |

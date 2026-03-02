# スプリントログ

ストーリーの完了記録と振り返りを蓄積する。

---

## Sprint 1（2026-02-28）

### 完了ストーリー

| ID     | タイトル                               | 受け入れ結果 | 備考                                                            |
| ------ | -------------------------------------- | ------------ | --------------------------------------------------------------- |
| US-001 | 受信一覧の即時可視化                   | OK           | 一覧はAPIで最新順、行クリックで詳細遷移を実装                   |
| US-002 | 絞り込みによるノイズ削減               | OK           | source/event_type フィルタが既存実装で成立                      |
| US-003 | ページングで大量データを安定閲覧       | OK           | API limit/offset、items+total 形式、前へ/次へUI を実装          |
| US-004 | 状態別UI（読み込み/空/エラー）の明確化 | OK           | スケルトン行、空説明+CTA、エラー帯+再試行ボタン                 |
| US-005 | 詳細情報の一画面集約                   | OK           | source/event_type/group_key/received_at をメタ情報として表示    |
| US-006 | Payload JSONの要素分解表示             | OK           | JsonTreeView で展開/折りたたみ、型表示、コピー・JSONPath コピー |
| US-007 | 重要フィールドの視認性向上             | OK           | id/amount/status 等をハイライト、欠損時は警告表示               |
| US-008 | フィールドごとのAI解説                 | OK           | 既存実装で成立（要約・フィールド別説明表示）                    |
| US-009 | AI分析失敗時の回復導線                 | OK           | 失敗時は赤帯で理由表示、再分析ボタン、API失敗は再試行ボタン     |
| US-010 | 分析ステータスの一覧可視化             | OK           | 一覧に分析済/未を表示、フィルタで未分析のみ表示可能             |
| US-011 | リアルタイム受信反映                   | OK           | WebSocket /ws、受信時ブロードキャスト、自動再接続・再接続ボタン |
| US-012 | 比較ビュー                             | OK           | 一覧で複数選択→比較画面、差分フィールド強調表示                 |
| US-013 | 保存ビュー/共有リンク                  | OK           | フィルタをURLに反映、共有リンクコピーで同条件を再現             |
| US-014 | event_type別の網羅一覧                 | OK           | GET /grouped-by-event-type、件数・代表例・新規タイプ表示        |
| US-015 | ペイロード構造のスキーマ自動推定       | OK           | GET /schema/estimate、共通フィールド・型・出現率・必須/任意     |
| US-016 | 調査レポートのエクスポート             | OK           | GET /report/markdown、要約・フィールド説明・スキーマ・サンプル  |
| US-017 | 一括AI分析                             | OK           | POST /batch-analyze、一覧の一括分析ボタン、完了/失敗件数表示    |
| US-018 | 調査セッション管理                     | OK           | セッションCRUD、Webhook紐づけ、セッション絞り込み               |

---

## Sprint 2（2026-02-28）Phase 6: デザイン刷新

### 完了ストーリー

| ID     | タイトル                                     | 受け入れ結果 | 備考                                                                               |
| ------ | -------------------------------------------- | ------------ | ---------------------------------------------------------------------------------- |
| US-101 | グローバルレイアウトとナビゲーションの統一   | OK           | Layout コンポーネント、共通ヘッダー、NavLink でアクティブ表示、SPA 遷移            |
| US-102 | DIMカラーテーマの適用                        | OK           | PolygonScan 風 #12161C 背景、#E4E6EA テキスト、blue-400 アクセント、index.css 整理 |
| US-108 | コピー/JSONPathコピーの修正とフィードバック  | OK           | アイコン化、成功時チェックマーク1秒、execCommand フォールバック                    |
| US-103 | ダークモード手動トグル                       | OK           | useDarkMode、localStorage 保存、OS 初回追従、ヘッダーに Sun/Moon トグル            |
| US-104 | タイポグラフィとスペーシングの統一           | OK           | SF Pro + Hiragino + Noto Sans JP、line-height 1.5                                  |
| US-105 | テーブル・カード・ボタンのコンポーネント洗練 | OK           | 行ホバー bg-slate-800/40、ボーダー半透明                                           |
| US-107 | 新着Webhookのリアルタイム挿入通知            | OK           | framer-motion スライドイン、ハイライト3秒、効果音、ミュートボタン                  |
| US-109 | JSONビューアのインタラクションをモダン化     | OK           | ホバー時のみアイコン表示、Clipboard/Path/Check アイコン                            |
| US-110 | 詳細画面の前後エントリ遷移                   | OK           | GET /webhooks/{id}/adjacent、前へ/次へボタン、矢印キーショートカット               |
| US-106 | JSONビューアのデザイン改善                   | OK           | キー #D4A574、文字列 #9FDFBF、数値薄青、展開/折りたたみアニメーション              |

---

## Sprint 3（2026-02-28）Phase 7: 開発ツール UX 刷新

### 完了ストーリー

| ID     | タイトル                               | 受け入れ結果 | 備考                                                                                              |
| ------ | -------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| US-114 | AI 分析エラーのレジリエンス強化        | OK           | trigger_analyze に try/except、ollama_analyzer.py の response.message を安全化、exc_info ログ追加 |
| US-113 | 受信順グローバルインデックス           | OK           | webhooks.sequence_index カラム追加、受信時に max+1 で採番、一覧・詳細に含める                     |
| US-116 | HTTP リクエストメタデータの保存と表示  | OK           | http_method/remote_ip/request_headers カラム追加、receive 時に記録、一覧・詳細に含める            |
| US-111 | webhook.site 風 2ペインレイアウト      | OK           | TwoPanePage、WebhookListPane、右ペインタブ切替、URLベースルーティング                             |
| US-112 | Payload 表形式表示とフィールド辞書統合 | OK           | PayloadTable コンポーネント、辞書・AI 説明の統合列、入れ子テーブル、未知バッジ                    |
| US-115 | 詳細画面セクション順序の最適化         | OK           | メタ→ドリフト→Payload→分析結果→分析ボタン、辞書セクション統合削除                                 |
| US-117 | ペインリサイズとレスポンシブ対応       | OK           | ドラッグリサイズハンドル、localStorage 幅保存、min/max 制約                                       |
| US-118 | 詳細画面のアコーディオンセクション     | OK           | AccordionSection、開閉アニメーション、状態 localStorage 保存、HTTPメタ表示                        |

---

## Sprint 4（2026-02-28）Phase 8: UI バグ修正と検索強化

### 完了ストーリー

| ID     | タイトル                                       | 受け入れ結果 | 備考                                                                                                                                 |
| ------ | ---------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| US-119 | 一覧ペインの UI バグ修正と source アイコン表示 | OK           | フィルタ縦積み、source プルダウン、SourceIcon（fireblocks/bitgo/alchemy/quicknode+ジェネリック）、py-1.5 行                          |
| US-120 | 詳細ペインの UI バグ修正とボタン改善           | OK           | RequestHeadersDetails 開閉維持、再分析 1 箇所、ゴーストボタン、Payload 表 colgroup・文字列クォート除去                               |
| US-121 | AI 分析の JSON パース堅牢化                    | OK           | プレーンテキスト→「LLM 出力が JSON ではありません」、parsed非dict→「不正な応答形式」、raw 500chars ログ、summary のみ許容            |
| US-122 | Payload 全文検索と検索結果一覧モード           | OK           | ヘッダー検索欄、API q パラメータ（ILIKE）、0件時「該当する Webhook がありません」                                                    |
| US-123 | グローバルヘッダーのホームリンク               | OK           | ロゴを Link to="/" に、クリックで初期状態へ                                                                                          |
| US-124 | フィールド辞書の YAML 定義ファイル化           | OK           | definitions/ 優先読み込み、migrate_field_templates_to_yaml.py、PyYAML                                                                |
| US-125 | AI 分析成功時の定義ファイル自動書き出し        | OK           | write_analysis_to_yaml、マージ、ai_generated                                                                                         |
| US-126 | 定義ファイルからの分析結果キャッシュ読み込み   | OK           | load_analysis_from_yaml、get_analysis フォールバック、from_definition_file バッジ                                                    |
| US-131 | ソースイニシャルアイコンの導入                 | OK           | SVG アイコン → 丸背景+頭文字イニシャル（w-5 h-5）、source 別カラー（fireblocks=orange, bitgo=blue, alchemy=purple, quicknode=green） |
| US-130 | Payload テーブルのカラムヘッダー英語化と値の全文表示 | OK           | ヘッダー key/value/type/description、truncate 廃止・break-all/whitespace-pre-wrap で全文表示 |
| US-127 | AI 分析の 3 層出力化とルールベースサニタイズ       | OK           | 3 段階 LLM（explanation→field_descriptions→summary）、サニタイズ、reference_url フェッチ、3 層 UI |
| US-128 | ユーザーフィードバック付き再分析                   | OK           | 再分析ボタン横に折りたたみ式フィードバック入力、Step 1 プロンプトに反映 |
| US-129 | API リファレンス自動 Web 検索                      | OK           | reference_url なし時に DuckDuckGo 検索、Step 1 コンテキストに含める、失敗時は続行 |
| US-132 | ページ遷移のフラッシュレス化                       | OK           | 前コンテンツ維持、ヘッダー薄プログレスバー、初回スケルトン、読み込み中テキスト廃止 |
| US-133 | AI 分析ボタンのスピナーアニメーション               | OK           | border スピナー、disabled 維持、分析完了でスピナー非表示                         |
| US-136 | DB 統計・ヘルスチェック CLI                        | OK           | stats: テーブル件数・ディスク・source/event_type 別・最古/最新・未分析件数         |
| US-137 | Webhook レコード検索・詳細表示 CLI                  | OK           | list, show, --format json、該当レコードなし                                      |
| US-138 | データ削除・パージ CLI                             | OK           | delete, purge --older-than 30d, reset --all、確認プロンプト + --yes               |
| US-139 | AI 分析結果リセット CLI                            | OK           | analysis reset --source/--all, analysis status                                   |
| US-140 | DB メンテナンス CLI                                | OK           | maintain vacuum (asyncpg), maintain reindex                                      |
| US-144 | マスキング表示                                     | OK           | デフォルトパターン（private_key等）、ON/OFF トグル、ネスト対応                    |
| US-145 | 受信リクエスト再送（Replay）                        | OK           | POST /webhooks/{id}/replay、URL 入力、ステータス・所要時間表示                    |
| US-134 | AI 分析の実行ログリアルタイムストリーミング        | OK           | POST /analyze/stream SSE、ログビューア自動展開、sessionStorage、総所要時間       |
| US-135 | AI 分析の 4 ステッププログレスバー                  | OK           | エビデンス→解説→フィールド→保存、緑/グレー表示、ストリーム同期                  |
| US-141 | 定義ファイルの UI 編集                              | OK           | PATCH /definitions、PayloadTable インライン編集、保存・キャンセル                |
| US-142 | 定義ファイルの diff 表示                            | OK           | DefinitionDiffModal、GET/POST /definitions、マージ・スキップ・部分的適用         |
| US-143 | LLM 比較モード                                      | OK           | provider/model オーバーライド、比較モードで並列表示（Ollama のみ対応）            |
| US-146 | 異常検知ルール                                      | OK           | data/alert_rules.json、GET/POST/DELETE /alert-rules、一覧・詳細にバッジ表示       |
| US-149 | AI 分析完了後の「未知」バッジ即時解除                | OK           | knownFieldPaths に分析 field_descriptions キーをマージ、description ありで isUnknown 解除 |
| US-151 | Step 2 field_descriptions のフィールド欠落バグ修正  | OK           | プロンプトに payload_keys を明示、_ensure_payload_keys_in_descriptions で不足キー補完 |
| US-147 | Payload テーブル全展開・全折りたたみ                | OK           | ExpandTriggerContext、全展開/全折りたたみボタン、個別トグルと共存                      |
| US-148 | AI 分析ログの所要時間リアルタイムカウント           | OK           | setInterval(1000)、sessionStorage に elapsedMs 保存・復元                              |
| US-150 | スキーマドリフトセクションの配置変更                | OK           | メタ→Payload→AI分析結果→スキーマドリフトの順序に変更                                   |
| US-152 | AI 分析ログの詳細情報拡充                           | OK           | timestamp/prompt_full/response_full、CollapsibleBlock、自動スクロール・一時停止         |
| US-153 | 分析ログの Webhook 切替時リセットと全タイムスタンプ付与 | OK           | ollama_analyzer 全 yield に timestamp、id 変化でログリセット、sessionStorage キーを ID ごとに |
| US-154 | 分析ログの表示領域拡大とプロンプト/回答デフォルト展開   | OK           | max-h-[960px]、CollapsibleBlock max-h-[512px]、デフォルト展開 useState(true)                 |
| US-155 | INBOX ヘッダーの Webhook 受信 URL 表示                  | OK           | URL 表示、クリック/アイコンでコピー、2秒間 ✓ フィードバック                                |
| US-156 | WebSocket リアルタイム更新の修復と接続状態改善          | OK           | Vite ws:true、status connecting/reconnecting/connected、新着時 page 1 表示               |
| US-157 | Payload テーブル「全展開」の全階層一括展開修正          | OK           | useExpandTrigger の useState 初期化子で expandAll > 0 をチェック、子マウント時から展開  |
| US-159 | Payload テーブル全展開の再修正とデフォルト全展開       | OK           | expandTrigger 初期値 1、defaultExpanded true で全階層デフォルト展開                    |
| US-166 | 個別 Webhook の PDF レポートエクスポート              | OK           | reportlab、GET /export/pdf、Export PDF ボタン、リクエスト/Payload/AI 分析を含む        |
| US-161 | 一覧ペインの表示件数拡大（500 件）                    | OK           | PAGE_SIZE 50→500                                                            |
| US-165 | UI ボタンラベルの英語統一                            | OK           | PayloadTable/WebhookDetailPage/WebhookListPane/WebhookListPage のボタンラベル |
| US-158 | Payload 表示モード切替（テーブル / JSON 生データ）   | OK           | Table/JSON タブ、Copy ボタン、フォーマット済み JSON 表示                        |
| US-160 | 一覧ペインの未読エントリハイライトと既読管理         | OK           | is_read カラム、PATCH /read、未読は font-semibold + 左ボーダー、選択で既読化      |
| US-163 | event_type フィルタのプルダウン選択肢表示             | OK           | getStats().by_event_type で候補表示、source と同様のプルダウン                     |
| US-164 | フィルタ入力のインクリメンタルサーチ                 | OK           | useDebounce 300ms、source/event_type 入力で自動フィルタ                            |
| US-162 | INBOX ヘッダーのサービス接続状況表示                 | OK           | GET /api/health/services、ServiceStatusPanel、30秒ポーリング、ngrok/API/DB/Ollama |
| US-167 | 一括既読操作と未読フィルタ                           | OK           | Mark All Read ボタン、Unread Only チェックボックス、POST /mark-all-read            |
| US-171 | PDF AI 分析結果の出力修正                            | OK           | DB に分析がない場合 load_analysis_from_yaml で定義ファイルからフォールバック       |
| US-172 | 未読エントリの恒久的背景ハイライト強化                | OK           | bg-blue-50/60 dark:bg-blue-900/25 で恒久表示、isSelected 優先                     |
| US-168 | ServiceStatusPanel の表形式化と UX 改善               | OK           | 5行テーブル、CopyableUrl、Live=緑/Offline=灰、text-xs、DB/Ollama url 追加         |
| US-169 | PDF Payload のテーブル形式表示                         | OK           | _flatten_payload で key/value/type/description、ドット記法、field_descriptions    |
| US-170 | PDF ヘッダー・フッターメタデータの追加                 | OK           | NumberedCanvas、#NNN、YYYY/MM/DD HH:MM:SS、Page X/Y                                |
| US-173 | 受信日時書式の統一（YYYY/MM/DD HH:MM:SS）               | OK           | formatReceivedAt ユーティリティ、一覧・詳細・比較・event_type別で統一               |
| US-174 | 詳細ペインナビゲーションバーの位置調整                  | OK           | DetailNavBar をタブ直下に固定、スクロールに追従せず Prev/Next/Replay/Export PDF 常時表示 |
| US-175 | source / event_type フィルタの相互連動                  | OK           | GET /filter-options、source 指定で event_type 絞り、event_type 指定で source 絞り、クリアで全件 |
| US-176 | INBOX ヘッダーの簡素化と URL 全文表示                    | OK           | 受信 URL バー削除、ServiceStatusPanel の thead 削除、max-w-[140px] 制約削除で URL 全文表示 |
| US-177 | ServiceStatusPanel の 2列ラベル化とコンパクト表示       | OK           | Part/Component 2列、絵文字🟢⚫、Vite行追加、localhost形式URL、text-[10px]、余白最小化 |
| US-178 | ヘルスチェックの信頼性向上                              | OK           | latency_ms/checked_at/error、Ollamaモデル確認、ngrok E2E HEAD、ツールチップ表示 |
| US-179 | お気に入りマークとお気に入りフィルタ                     | OK           | is_favorite カラム、PATCH /favorite トグル、Favorites Only チェックボックス、星☆★アイコン、「No favorites yet」空状態 |
| US-180 | Fireblocks Notifications 形式の自動分類                  | OK           | classifier に category/subject/eventKey/event 検出を追加、event_type = eventKey.event.lower()、group_key 既存形式維持 |
| US-181 | AI 分析時の unknown ソース自動再分類                     | OK           | source=unknown 時のみ LLM で source/event_type 推論、分析成功時に Webhook 更新、YAML パスを推論結果で決定、既知 Webhook は更新しない |
| US-182 | 既存 unknown Webhook のルールベース一括再分類           | OK           | POST /api/webhooks/reclassify、source=unknown の全件に classifier 再適用、total/reclassified/unchanged レスポンス |
| US-183 | unknown Webhook の UI 再分類ボタン                     | OK           | Reclassify All ボタン（INBOX ヘッダー、unknown 存在時のみ）、個別 Reclassify ボタン（DetailNavBar、unknown のみ）、POST /{id}/reclassify API |
| US-184 | Fireblocks Notifications 分類の eventKey 依存除去      | OK           | classifier 条件から eventKey を除去、category+subject+event の 3 フィールドで判定、subject を正規化して event_type 導出、Reclassify ボタン unchanged 時フィードバック追加 |

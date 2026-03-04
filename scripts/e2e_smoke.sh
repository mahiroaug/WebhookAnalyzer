#!/usr/bin/env bash
# E2E 疎通確認スクリプト
# 前提: バックエンド (8000) と フロントエンド (5173) が起動していること
set -euo pipefail

API="${API_BASE:-http://localhost:8000}"
FE="${FE_BASE:-http://localhost:5173}"

# ANSI カラー（NO_COLOR が設定されていれば無効化）
if [ -n "${NO_COLOR:-}" ]; then
  G= C= R= D= B= X=
else
  G='\033[32m'   # green
  C='\033[36m'   # cyan
  R='\033[31m'   # red
  D='\033[90m'   # dim
  B='\033[1m'    # bold
  X='\033[0m'    # reset
fi

# 表示: チェック名 | プロセス | ポート | 状態 | 補足
ok()  { printf "  ${G}✓${X} %-18s  %-10s  %5s   ${G}OK${X}%s\n"  "$1" "$2" "$3" "${4:-}"; }
fail(){ printf "  ${R}✗${X} %-18s  %-10s  %5s   ${R}FAIL${X}%s\n" "$1" "$2" "$3" "${4:-}"; exit 1; }
skip(){ printf "  ${D}○${X} %-18s  %-10s  %5s   ${D}SKIP${X}%s\n" "$1" "$2" "$3" "${4:-}"; }

echo ""
echo -e "  ${B}E2E Smoke Test${X}"
echo -e "  ${D}────────────────────────────────────────────────────────────${X}"
printf "  API:   %s\n" "$API"
printf "  FE:    %s\n" "$FE"
echo ""
printf "  %-18s  %-10s  %5s   %s\n" "Check" "Process" "Port" "Status"
echo -e "  ${D}────────────────────────────────────────────────────────────${X}"

# 1. ヘルスチェック
curl -sf "$API/health" > /dev/null && ok "Health check" "uvicorn" "8000" "" || fail "Health check" "uvicorn" "8000" ""

# 2. 受信
RESP=$(curl -sf -X POST "$API/api/webhooks/receive" \
  -H "Content-Type: application/json" \
  -d '{"type":"transfer","coin":"test","hash":"0x123"}')
ID=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))")
[ -n "$ID" ] && ok "Receive webhook" "uvicorn" "8000" " (id=${ID:0:8}...)" || fail "Receive webhook" "uvicorn" "8000" ""

# 3. 一覧
curl -sf "$API/api/webhooks" > /dev/null && ok "List webhooks" "uvicorn" "8000" "" || fail "List webhooks" "uvicorn" "8000" ""

# 4. 詳細
curl -sf "$API/api/webhooks/$ID" > /dev/null && ok "Get detail" "uvicorn" "8000" "" || fail "Get detail" "uvicorn" "8000" ""

# 5. 統計
curl -sf "$API/api/webhooks/stats" > /dev/null && ok "Get stats" "uvicorn" "8000" "" || fail "Get stats" "uvicorn" "8000" ""

# 6. フロントエンド HTML（Vite 起動に数秒かかるためリトライ）
FE_OK=false
for _ in 1 2 3 4 5 6; do
  if curl -sf --connect-timeout 2 "$FE" 2>/dev/null | grep -q '<div id="root">'; then
    FE_OK=true
    break
  fi
  sleep 2
done
$FE_OK && ok "Frontend HTML" "vite" "5173" "" || fail "Frontend HTML" "vite" "5173" " (cd frontend && npm run dev)"

# 7. ngrok エージェント（オプション: .env に NGROK_AUTH_TOKEN があれば自動起動）
NGROK_JSON=$(curl -sf http://127.0.0.1:4040/api/tunnels 2>/dev/null) || true
if [ -n "$NGROK_JSON" ]; then
  NGROK_URL=$(echo "$NGROK_JSON" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    tunnels = d.get('tunnels', [])
    if tunnels:
        print(tunnels[0].get('public_url', ''))
except: pass
" 2>/dev/null)
  if [ -n "$NGROK_URL" ]; then
    ok "ngrok agent" "ngrok" "4040" ""
    printf "    ${C}%s${X}\n" "$NGROK_URL"
  else
    ok "ngrok agent" "ngrok" "4040" " (tunnel running)"
  fi
else
  skip "ngrok agent" "ngrok" "4040" " (not running)"
fi

echo ""
echo -e "  ${G}${B}All checks passed${X}"
echo ""

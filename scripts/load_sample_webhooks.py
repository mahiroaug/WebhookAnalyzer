#!/usr/bin/env python3
"""
experimental/sample_data から Webhook JSON を抽出し、API に POST する。
E2E 疎通確認用。
"""
import json
import re
import sys
from pathlib import Path

import httpx

BASE_URL = "http://localhost:8000"


def extract_json_blocks(content: str) -> list[dict]:
    """Markdown 内の ```json ... ``` ブロックを抽出"""
    blocks: list[dict] = []
    pattern = r"```(?:json)?\s*\n(.*?)\n```"
    for m in re.finditer(pattern, content, re.DOTALL):
        try:
            block = json.loads(m.group(1).strip())
            if isinstance(block, dict):
                blocks.append(block)
        except json.JSONDecodeError:
            pass
    return blocks


def load_samples_from_dir(data_dir: Path) -> list[dict]:
    """sample_data 配下の .md ファイルから JSON を抽出"""
    samples: list[dict] = []
    for path in sorted(data_dir.glob("*.md")):
        content = path.read_text(encoding="utf-8")
        blocks = extract_json_blocks(content)
        for b in blocks:
            samples.append(b)
    return samples


def main() -> int:
    workspace = Path(__file__).resolve().parent.parent
    data_dir = workspace / "experimental" / "sample_data"
    if not data_dir.exists():
        print(f"データディレクトリがありません: {data_dir}", file=sys.stderr)
        return 1

    samples = load_samples_from_dir(data_dir)
    if not samples:
        print("抽出された Webhook がありません", file=sys.stderr)
        return 1

    print(f"抽出: {len(samples)} 件")
    success = 0
    for i, payload in enumerate(samples):
        try:
            resp = httpx.post(
                f"{BASE_URL}/api/webhooks/receive",
                json=payload,
                timeout=10.0,
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                print(f"  [{i+1}] OK id={data.get('id', '')[:8]}... source={data.get('source')} event_type={data.get('event_type')}")
                success += 1
            else:
                print(f"  [{i+1}] FAIL {resp.status_code}: {resp.text[:100]}", file=sys.stderr)
        except Exception as e:
            print(f"  [{i+1}] ERROR: {e}", file=sys.stderr)

    print(f"\n成功: {success}/{len(samples)}")
    return 0 if success == len(samples) else 1


if __name__ == "__main__":
    sys.exit(main())

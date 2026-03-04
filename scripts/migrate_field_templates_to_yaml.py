#!/usr/bin/env python3
"""
US-124: field_templates.py のハードコードデータを definitions/ に YAML として出力する。
実行: python scripts/migrate_field_templates_to_yaml.py
"""
import re
from pathlib import Path

import yaml

# プロジェクトルートを取得（このスクリプトは workspace/scripts/ にある想定）
WORKSPACE = Path(__file__).resolve().parent.parent
DEFINITIONS_DIR = WORKSPACE / "definitions"


def _safe_filename(s: str) -> str:
    """ファイル名に使えない文字を置換"""
    return re.sub(r'[\/\\:*?"<>|]', "_", s)


def main() -> int:
    from app.services.field_templates import FIELD_TEMPLATES

    for source, by_event in FIELD_TEMPLATES.items():
        for event_type, fields in by_event.items():
            safe_source = _safe_filename(source.lower())
            safe_event = _safe_filename(event_type.lower())
            out_dir = DEFINITIONS_DIR / safe_source
            out_dir.mkdir(parents=True, exist_ok=True)
            out_path = out_dir / f"{safe_event}.yaml"

            data: dict = {
                "fields": [
                    {
                        "path": f.path,
                        "description": f.description,
                        **({"notes": f.notes} if f.notes else {}),
                        **({"reference_url": f.reference_url} if f.reference_url else {}),
                    }
                    for f in fields
                ]
            }
            with open(out_path, "w", encoding="utf-8") as fh:
                yaml.dump(data, fh, allow_unicode=True, default_flow_style=False, sort_keys=False)

            print(f"  {out_path}")

    print(f"\n出力完了: {DEFINITIONS_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

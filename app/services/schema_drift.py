"""スキーマドリフト検知サービス。
同一 event_type の基準スキーマと新規 Webhook のペイロードを比較し、
追加・削除・型変更を検出する。
"""

from dataclasses import dataclass


@dataclass
class SchemaDriftResult:
    """スキーマドリフト検知結果"""

    has_drift: bool
    added: list[str]  # 基準にないが payload にあるフィールド
    removed: list[str]  # 基準にあるが payload にないフィールド
    type_changed: list[tuple[str, str, str]]  # (path, expected_type, actual_type)
    risk_level: str | None  # "high" | "medium" | "low" | None


def _infer_type(val: object) -> str:
    if val is None:
        return "null"
    if isinstance(val, bool):
        return "boolean"
    if isinstance(val, (int, float)):
        return "number" if isinstance(val, float) else "integer"
    if isinstance(val, str):
        return "string"
    if isinstance(val, list):
        return "array"
    if isinstance(val, dict):
        return "object"
    return "unknown"


def _flatten_schema(obj: dict, prefix: str = "") -> dict[str, str]:
    """ペイロードを平坦化して パス->型 を返す"""
    result: dict[str, str] = {}
    for key, val in obj.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(val, dict):
            result[path] = "object"
            result.update(_flatten_schema(val, path))
        elif isinstance(val, list):
            result[path] = "array"
            if val and isinstance(val[0], dict):
                result.update(_flatten_schema(val[0], f"{path}[]"))
        else:
            result[path] = _infer_type(val)
    return result


def compute_drift(
    payload: dict,
    baseline_fields: dict[str, tuple[str, bool]],
) -> SchemaDriftResult:
    """
    ペイロードと基準スキーマを比較し、ドリフトを検出する。

    Args:
        payload: 対象 Webhook のペイロード
        baseline_fields: 基準スキーマ。path -> (type, required)

    Returns:
        SchemaDriftResult
    """
    actual = _flatten_schema(payload)
    actual_paths = set(actual.keys())
    baseline_paths = set(baseline_fields.keys())

    added = sorted(actual_paths - baseline_paths)
    removed = sorted(baseline_paths - actual_paths)
    type_changed: list[tuple[str, str, str]] = []
    for path in sorted(actual_paths & baseline_paths):
        exp_type, _ = baseline_fields[path]
        act_type = actual[path]
        if exp_type != act_type:
            type_changed.append((path, exp_type, act_type))

    has_drift = bool(added or removed or type_changed)

    # リスク評価: 必須項目の欠落・型変更は高リスク
    risk_level: str | None = None
    if removed or type_changed:
        high_risk_removed = any(
            baseline_fields.get(p, ("", False))[1] for p in removed
        )
        if high_risk_removed or type_changed:
            risk_level = "high"
        else:
            risk_level = "medium"
    elif added:
        risk_level = "low"

    return SchemaDriftResult(
        has_drift=has_drift,
        added=added,
        removed=removed,
        type_changed=type_changed,
        risk_level=risk_level,
    )


def schema_drift_to_dict(result: SchemaDriftResult) -> dict:
    """API レスポンス用に dict に変換"""
    return {
        "has_drift": result.has_drift,
        "added": result.added,
        "removed": result.removed,
        "type_changed": [
            {"path": p, "expected_type": e, "actual_type": a}
            for p, e, a in result.type_changed
        ],
        "risk_level": result.risk_level,
    }

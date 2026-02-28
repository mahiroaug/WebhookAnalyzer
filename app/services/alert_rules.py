"""
US-146: 異常検知ルール。
条件を満たす Webhook にバッジ・ハイライトを付与する。
"""
from pathlib import Path

_RULES_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "alert_rules.json"


def _ensure_data_dir() -> Path:
    _RULES_PATH.parent.mkdir(parents=True, exist_ok=True)
    return _RULES_PATH


def _load_rules() -> list[dict]:
    """ルール一覧を読み込み"""
    path = _ensure_data_dir()
    if not path.exists():
        return []
    try:
        import json

        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _save_rules(rules: list[dict]) -> None:
    """ルール一覧を保存"""
    import json

    path = _ensure_data_dir()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(rules, f, ensure_ascii=False, indent=2)


def _get_value_at_path(obj: dict, path: str):
    """payload から path で指定した値を取得。例: data.amount -> obj['data']['amount']"""
    parts = path.strip().split(".")
    current = obj
    for p in parts:
        if not isinstance(current, dict):
            return None
        current = current.get(p)
    return current


def _evaluate_single(rule: dict, payload: dict) -> bool:
    """1 ルールをペイロードに対して評価"""
    path = rule.get("path")
    op = rule.get("op", "==")
    value = rule.get("value")
    if not path:
        return False
    actual = _get_value_at_path(payload, path)
    if actual is None and op != "!=":
        return False
    try:
        if op == "==":
            return actual == value
        if op == "!=":
            return actual != value
        if op in (">", "<", ">=", "<="):
            a = float(actual) if isinstance(actual, (int, float)) else float(str(actual))
            b = float(value) if isinstance(value, (int, float)) else float(str(value))
            return (op == ">" and a > b) or (op == "<" and a < b) or (op == ">=" and a >= b) or (op == "<=" and a <= b)
        if op == "contains":
            return value in str(actual) if actual is not None else False
    except (TypeError, ValueError):
        return False
    return False


def evaluate_rules(payload: dict) -> list[dict]:
    """ペイロードに対して全ルールを評価し、マッチしたルールのリストを返す"""
    rules = _load_rules()
    return [r for r in rules if _evaluate_single(r, payload)]


def list_rules() -> list[dict]:
    """ルール一覧を返す"""
    return _load_rules()


def add_rule(name: str, path: str, op: str, value) -> dict:
    """ルールを追加"""
    import uuid

    rules = _load_rules()
    rule = {"id": str(uuid.uuid4())[:8], "name": name, "path": path, "op": op, "value": value}
    rules.append(rule)
    _save_rules(rules)
    return rule


def delete_rule(rule_id: str) -> bool:
    """ルールを削除"""
    rules = _load_rules()
    orig_len = len(rules)
    rules = [r for r in rules if r.get("id") != rule_id]
    if len(rules) == orig_len:
        return False
    _save_rules(rules)
    return True

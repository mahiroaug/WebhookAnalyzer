"""US-146: 異常検知ルール API"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.alert_rules import add_rule, delete_rule, list_rules

router = APIRouter(prefix="/alert-rules", tags=["alert-rules"])


class RuleCreate(BaseModel):
    """ルール作成"""
    name: str
    path: str
    op: str  # ==, !=, >, <, >=, <=, contains
    value: str | int | float | bool


class RuleResponse(BaseModel):
    """ルールレスポンス"""
    id: str
    name: str
    path: str
    op: str
    value: str | int | float | bool


@router.get("", response_model=list[RuleResponse])
async def get_rules() -> list[RuleResponse]:
    """ルール一覧"""
    rules = list_rules()
    return [RuleResponse(id=r["id"], name=r["name"], path=r["path"], op=r["op"], value=r["value"]) for r in rules]


@router.post("", response_model=RuleResponse, status_code=201)
async def create_rule(body: RuleCreate) -> RuleResponse:
    """ルールを追加"""
    if body.op not in ("==", "!=", ">", "<", ">=", "<=", "contains"):
        raise HTTPException(status_code=400, detail=f"Invalid op: {body.op}")
    rule = add_rule(body.name, body.path, body.op, body.value)
    return RuleResponse(id=rule["id"], name=rule["name"], path=rule["path"], op=rule["op"], value=rule["value"])


@router.delete("/{rule_id}")
async def remove_rule(rule_id: str) -> dict:
    """ルールを削除"""
    if not delete_rule(rule_id):
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"ok": True}

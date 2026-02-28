"""定義ファイル API（US-141: UI 編集）"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.field_templates import (
    definition_exists,
    definition_is_writable,
    update_field_description,
)

router = APIRouter(prefix="/definitions", tags=["definitions"])


class DefinitionStatusResponse(BaseModel):
    """定義ファイルの存在・編集可否"""
    exists: bool
    writable: bool


class UpdateFieldRequest(BaseModel):
    """フィールド description 更新リクエスト"""
    path: str
    description: str


class UpdateFieldResponse(BaseModel):
    """更新成功レスポンス"""
    ok: bool


@router.get("/{source}/{event_type}", response_model=DefinitionStatusResponse)
async def get_definition_status(source: str, event_type: str) -> DefinitionStatusResponse:
    """
    US-141: 定義ファイルの存在と編集可否を返す。
    source / event_type は URL パス（スラッシュを含む場合はエンコード）。
    """
    exists = definition_exists(source, event_type)
    writable = definition_is_writable(source, event_type) if exists else False
    return DefinitionStatusResponse(exists=exists, writable=writable)


@router.patch("/{source}/{event_type}/fields", response_model=UpdateFieldResponse)
async def patch_field_description(
    source: str,
    event_type: str,
    body: UpdateFieldRequest,
) -> UpdateFieldResponse:
    """
    US-141: 定義ファイル内の指定フィールドの description を更新する。
    定義ファイルが存在しない・読み取り専用・パス未定義の場合はエラー。
    """
    try:
        update_field_description(source, event_type, body.path, body.description)
        return UpdateFieldResponse(ok=True)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

"""定義ファイル API（US-141: UI 編集、US-142: diff・マージ）"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.field_templates import (
    definition_exists,
    definition_is_writable,
    get_definition_content,
    merge_analysis_to_yaml,
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


class DefinitionContentResponse(BaseModel):
    """US-142: 定義ファイルの内容"""
    summary: str
    field_descriptions: dict[str, str]


class MergeRequest(BaseModel):
    """US-142: マージリクエスト"""
    summary: str | None = None
    field_descriptions: dict[str, str] = {}
    removed_paths: list[str] | None = None


@router.get("/{source}/{event_type}/content", response_model=DefinitionContentResponse)
async def get_definition_content_api(
    source: str,
    event_type: str,
) -> DefinitionContentResponse:
    """
    US-142: 定義ファイルの内容（summary, field_descriptions）を返す。
    存在しない場合は 404。
    """
    content = get_definition_content(source, event_type)
    if content is None:
        raise HTTPException(status_code=404, detail="Definition file not found")
    return DefinitionContentResponse(
        summary=content["summary"],
        field_descriptions=content["field_descriptions"],
    )


@router.post("/{source}/{event_type}/merge", response_model=UpdateFieldResponse)
async def merge_definition(
    source: str,
    event_type: str,
    body: MergeRequest,
) -> UpdateFieldResponse:
    """
    US-142: AI 分析結果を定義ファイルにマージする。
    """
    try:
        merge_analysis_to_yaml(
            source,
            event_type,
            body.summary,
            body.field_descriptions,
            body.removed_paths,
        )
        return UpdateFieldResponse(ok=True)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

"""US-166: 個別 Webhook の PDF レポート生成"""
import io
import json
from datetime import datetime, timezone
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

# Web UI ダークテーマを踏襲した配色（PDF は白背景のため反転）
BG_DARK = "#12161C"
TEXT_LIGHT = "#E4E6EA"
ACCENT = "#60A5FA"
MUTED = "#94A3B8"


def _header_style() -> ParagraphStyle:
    """セクション見出しスタイル"""
    styles = getSampleStyleSheet()
    return ParagraphStyle(
        name="SectionHeader",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=6,
    )


def _flatten_payload(
    obj: Any,
    prefix: str = "",
    descriptions: dict[str, str] | None = None,
) -> list[tuple[str, str, str, str]]:
    """US-169: Payload を key/value/type/description のフラットリストに展開"""
    descriptions = descriptions or {}
    rows: list[tuple[str, str, str, str]] = []

    def _type_name(val: Any) -> str:
        if val is None:
            return "null"
        if isinstance(val, bool):
            return "boolean"
        if isinstance(val, int):
            return "number"
        if isinstance(val, float):
            return "number"
        if isinstance(val, str):
            return "string"
        if isinstance(val, list):
            return "array"
        if isinstance(val, dict):
            return "object"
        return "unknown"

    def _format_value(val: Any) -> str:
        if val is None:
            return "null"
        if isinstance(val, str):
            return val
        if isinstance(val, (int, float, bool)):
            return str(val)
        if isinstance(val, list):
            return f"[{len(val)} items]"
        if isinstance(val, dict):
            return "{...}"
        return str(val)

    def _walk(o: Any, path: str) -> None:
        if o is None or (not isinstance(o, (dict, list))):
            rows.append((
                path or "—",
                _format_value(o),
                _type_name(o),
                (descriptions.get(path) or descriptions.get(path.split(".")[-1]) or "")[:300],
            ))
            return
        if isinstance(o, list):
            rows.append((
                path,
                f"[{len(o)} items]",
                "array",
                (descriptions.get(path) or descriptions.get(path.split(".")[-1]) or "")[:300],
            ))
            for i, item in enumerate(o):
                _walk(item, f"{path}.{i}")
            return
        if isinstance(o, dict):
            for k, v in o.items():
                child_path = f"{path}.{k}" if path else k
                if v is not None and isinstance(v, (dict, list)):
                    _walk(v, child_path)
                else:
                    rows.append((
                        child_path,
                        _format_value(v),
                        _type_name(v),
                        (descriptions.get(child_path) or descriptions.get(child_path.split(".")[-1]) or "")[:300],
                    ))

    if isinstance(obj, dict):
        for k, v in obj.items():
            _walk(v, k)
    else:
        rows.append(("—", _format_value(obj), _type_name(obj), ""))

    return rows


def _body_style() -> ParagraphStyle:
    """本文スタイル"""
    styles = getSampleStyleSheet()
    return ParagraphStyle(
        name="BodyMono",
        parent=styles["Normal"],
        fontSize=9,
        fontName="Courier",
        textColor=colors.HexColor("#334155"),
        leading=12,
    )


def _make_numbered_canvas(sequence_index: int | None, output_time: datetime) -> type:
    """US-170: ヘッダー・フッター付きカンバスクラスを生成"""
    from reportlab.pdfgen import canvas as pdf_canvas

    class NumberedCanvas(pdf_canvas.Canvas):
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            super().__init__(*args, **kwargs)
            self._saved_states: list[dict[str, Any]] = []
            self._seq = sequence_index
            self._out_time = output_time

        def showPage(self) -> None:
            state = {k: v for k, v in self.__dict__.items() if k != "_saved_states"}
            self._saved_states.append(state)
            super().showPage()

        def save(self) -> None:
            num_pages = len(self._saved_states)
            for i, state in enumerate(self._saved_states):
                for k, v in state.items():
                    setattr(self, k, v)
                self.saveState()
                header_text = f"Webhook Report #{self._seq}" if self._seq else "Webhook Report"
                header_date = self._out_time.strftime("%Y/%m/%d %H:%M:%S")
                self.setFont("Helvetica-Bold", 10)
                self.drawString(56, 800, header_text)
                self.setFont("Helvetica", 9)
                self.drawString(400, 800, header_date)
                self.setFont("Helvetica", 8)
                self.drawRightString(550, 30, f"Page {i + 1} / {num_pages}")
                self.restoreState()
                super().showPage()
            super().save()

    return NumberedCanvas


def build_webhook_pdf(
    source: str,
    event_type: str,
    group_key: str,
    received_at: datetime,
    http_method: str | None,
    remote_ip: str | None,
    request_headers: dict | None,
    payload: dict,
    analysis_summary: str | None,
    analysis_explanation: str | None,
    analysis_field_descriptions: dict | None,
    sequence_index: int | None = None,
) -> bytes:
    """
    Webhook 詳細の PDF レポートを生成する。
    リクエスト情報・Payload・AI 分析結果を含む。
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )
    story = []

    header_style = _header_style()
    body_style = _body_style()

    # タイトル
    story.append(
        Paragraph(
            f"Webhook Report: {source} / {event_type}",
            ParagraphStyle(
                name="Title",
                fontSize=18,
                textColor=colors.HexColor("#0F172A"),
                spaceAfter=12,
            ),
        )
    )

    # 1. リクエスト情報
    story.append(Paragraph("Request Information", header_style))
    req_data = [
        ["source", source],
        ["event_type", event_type],
        ["group_key", group_key],
        ["received_at", received_at.strftime("%Y-%m-%d %H:%M:%S UTC") if received_at else "-"],
        ["HTTP method", http_method or "-"],
        ["Remote IP", remote_ip or "-"],
    ]
    if request_headers:
        req_data.append(["Headers", json.dumps(request_headers, indent=2, ensure_ascii=False)])
    else:
        req_data.append(["Headers", "-"])

    req_table = Table(req_data, colWidths=[100, 350])
    req_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#334155")),
                ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 9),
                ("FONT", (1, 0), (1, -1), "Courier", 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(req_table)
    story.append(Spacer(1, 12))

    # 2. Payload（US-169: key/value/type/description テーブル形式）
    story.append(Paragraph("Payload", header_style))
    flat_rows = _flatten_payload(
        payload or {},
        descriptions=analysis_field_descriptions or {},
    )
    payload_data = [["key", "value", "type", "description"]]
    for path, val, typ, desc in flat_rows[:200]:  # 最大 200 行
        payload_data.append([path, str(val)[:500], typ, desc])
    if len(flat_rows) > 200:
        payload_data.append(["...", f"({len(flat_rows) - 200} more rows)", "", ""])
    payload_table = Table(payload_data, colWidths=[100, 180, 50, 170])
    payload_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#334155")),
                ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 9),
                ("FONT", (0, 1), (-1, -1), "Courier", 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("WORDWRAP", (1, 0), (1, -1), True),
                ("WORDWRAP", (3, 0), (3, -1), True),
            ]
        )
    )
    story.append(payload_table)
    story.append(Spacer(1, 12))

    # 3. AI 分析結果
    story.append(Paragraph("AI Analysis", header_style))
    if analysis_summary or analysis_field_descriptions or analysis_explanation:
        if analysis_summary:
            story.append(Paragraph("<b>Summary</b>", body_style))
            story.append(Paragraph(analysis_summary.replace("<", "&lt;").replace(">", "&gt;"), body_style))
            story.append(Spacer(1, 6))
        if analysis_explanation:
            story.append(Paragraph("<b>Explanation</b>", body_style))
            story.append(Paragraph(analysis_explanation[:3000].replace("<", "&lt;").replace(">", "&gt;"), body_style))
            if len(analysis_explanation) > 3000:
                story.append(Paragraph("... (truncated)", body_style))
            story.append(Spacer(1, 6))
        if analysis_field_descriptions:
            story.append(Paragraph("<b>Field Descriptions</b>", body_style))
            fd_data = [["Key", "Description"]]
            for k, v in list(analysis_field_descriptions.items())[:50]:
                fd_data.append([k, str(v)[:200]])
            fd_table = Table(fd_data, colWidths=[120, 330])
            fd_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#334155")),
                        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 9),
                        ("FONT", (0, 1), (-1, -1), "Courier", 8),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 6),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ]
                )
            )
            story.append(fd_table)
    else:
        story.append(Paragraph("Not analyzed", body_style))

    output_time = datetime.now(timezone.utc)
    canvas_cls = _make_numbered_canvas(sequence_index, output_time)
    doc.build(story, canvasmaker=canvas_cls)
    return buffer.getvalue()

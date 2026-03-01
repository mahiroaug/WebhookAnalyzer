"""US-166: 個別 Webhook の PDF レポート生成"""
import io
import json
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, Preformatted, SimpleDocTemplate, Spacer, Table, TableStyle

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

    # 2. Payload
    story.append(Paragraph("Payload", header_style))
    payload_str = json.dumps(payload, indent=2, ensure_ascii=False)
    truncated = payload_str[:8000] if len(payload_str) > 8000 else payload_str
    story.append(Preformatted(truncated, body_style))
    if len(payload_str) > 8000:
        story.append(Paragraph(f"... (truncated, total {len(payload_str)} chars)", body_style))
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

    doc.build(story)
    return buffer.getvalue()

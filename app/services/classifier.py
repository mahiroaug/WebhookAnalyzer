"""ルールベース Webhook 分類器"""

from app.schemas.webhook import ClassificationResult


def classify_webhook(payload: dict) -> ClassificationResult:
    """
    Webhook ペイロードをルールに従って分類する。
    source と event_type を判定し、group_key を生成する。
    """
    source = "unknown"
    event_type = "unknown"

    # BitGo Wallet: type == "transfer" and coin exists
    if payload.get("type") == "transfer" and "coin" in payload:
        source = "bitgo"
        event_type = "transfer"

    # BitGo PendingApproval: type == "pendingapproval"
    elif payload.get("type") == "pendingapproval":
        source = "bitgo"
        event_type = "pendingapproval"

    # BitGo TxRequest: webhookType == "txRequest"
    elif payload.get("webhookType") == "txRequest":
        source = "bitgo"
        event_type = "txrequest"

    # Fireblocks TX: eventType starts with "transaction."
    elif isinstance(payload.get("eventType"), str) and payload["eventType"].startswith(
        "transaction."
    ):
        source = "fireblocks"
        event_type = payload["eventType"]

    # Fireblocks Wallet: eventType starts with "vault_account."
    elif isinstance(payload.get("eventType"), str) and payload["eventType"].startswith(
        "vault_account."
    ):
        source = "fireblocks"
        event_type = payload["eventType"]

    # Alchemy: webhookId exists and event.network exists
    elif "webhookId" in payload:
        event_obj = payload.get("event") or {}
        if isinstance(event_obj, dict) and event_obj.get("network"):
            source = "alchemy"
            event_type = payload.get("type") or "graphql"
            event_type = str(event_type).lower()

    # QuickNode: matchingReceipts exists
    elif "matchingReceipts" in payload:
        source = "quicknode"
        event_type = "matching_receipts"

    group_key = f"{source}:{event_type}"
    return ClassificationResult(source=source, event_type=event_type, group_key=group_key)

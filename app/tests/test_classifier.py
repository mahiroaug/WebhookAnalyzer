"""分類ロジックの単体テスト (TDD Red → Green)"""
import pytest

from app.services.classifier import classify_webhook


class TestClassifyWebhook:
    """classify_webhook のテスト"""

    def test_bitgo_transfer(
        self,
        bitgo_transfer_payload: dict,
    ) -> None:
        """BitGo Wallet transfer を正しく分類する"""
        result = classify_webhook(bitgo_transfer_payload)
        assert result.source == "bitgo"
        assert result.event_type == "transfer"
        assert result.group_key == "bitgo:transfer"

    def test_bitgo_pending_approval(
        self,
        bitgo_pending_approval_payload: dict,
    ) -> None:
        """BitGo PendingApproval を正しく分類する"""
        result = classify_webhook(bitgo_pending_approval_payload)
        assert result.source == "bitgo"
        assert result.event_type == "pendingapproval"
        assert result.group_key == "bitgo:pendingapproval"

    def test_bitgo_tx_request(
        self,
        bitgo_tx_request_payload: dict,
    ) -> None:
        """BitGo TxRequest を正しく分類する"""
        result = classify_webhook(bitgo_tx_request_payload)
        assert result.source == "bitgo"
        assert result.event_type == "txrequest"
        assert result.group_key == "bitgo:txrequest"

    def test_fireblocks_tx(
        self,
        fireblocks_tx_payload: dict,
    ) -> None:
        """Fireblocks TX を正しく分類する"""
        result = classify_webhook(fireblocks_tx_payload)
        assert result.source == "fireblocks"
        assert result.event_type == "transaction.created"
        assert result.group_key == "fireblocks:transaction.created"

    def test_fireblocks_wallet(
        self,
        fireblocks_wallet_payload: dict,
    ) -> None:
        """Fireblocks Wallet を正しく分類する"""
        result = classify_webhook(fireblocks_wallet_payload)
        assert result.source == "fireblocks"
        assert result.event_type == "vault_account.asset.balance_updated"
        assert result.group_key == "fireblocks:vault_account.asset.balance_updated"

    def test_alchemy(
        self,
        alchemy_payload: dict,
    ) -> None:
        """Alchemy を正しく分類する"""
        result = classify_webhook(alchemy_payload)
        assert result.source == "alchemy"
        assert result.event_type == "graphql"
        assert result.group_key == "alchemy:graphql"

    def test_quicknode(
        self,
        quicknode_payload: dict,
    ) -> None:
        """QuickNode を正しく分類する"""
        result = classify_webhook(quicknode_payload)
        assert result.source == "quicknode"
        assert result.event_type == "matching_receipts"
        assert result.group_key == "quicknode:matching_receipts"

    def test_fireblocks_notifications(
        self,
        fireblocks_notifications_payload: dict,
    ) -> None:
        """US-180: Fireblocks Notifications 形式を正しく分類する"""
        result = classify_webhook(fireblocks_notifications_payload)
        assert result.source == "fireblocks"
        assert result.event_type == "transaction.submitted"
        assert result.group_key == "fireblocks:transaction.submitted"

    def test_fireblocks_notifications_event_lowercase(
        self,
        fireblocks_notifications_payload: dict,
    ) -> None:
        """US-180: event を小文字化して event_type に含める"""
        fireblocks_notifications_payload["event"] = "BROADCASTING"
        result = classify_webhook(fireblocks_notifications_payload)
        assert result.event_type == "transaction.broadcasting"

    def test_unknown(
        self,
        unknown_payload: dict,
    ) -> None:
        """未知の形式を unknown に分類する（category/subject/eventKey を持たない）"""
        result = classify_webhook(unknown_payload)
        assert result.source == "unknown"
        assert result.event_type == "unknown"
        assert result.group_key == "unknown:unknown"

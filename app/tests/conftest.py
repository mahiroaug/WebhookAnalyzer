"""pytest 設定・フィクスチャ"""
import pytest


@pytest.fixture
def bitgo_transfer_payload() -> dict:
    """BitGo Wallet transfer サンプル"""
    return {
        "hash": "0x7fff5b5064390815ad42526d8e1c03372fc473d550c073cf87fa8dc186cf2959",
        "transfer": "6989f7bafbbe2bc87d1cab0cbb528b15",
        "coin": "tpolygon",
        "type": "transfer",
        "state": "confirmed",
        "wallet": "69897779129febb7e2f31f6407b2f459",
    }


@pytest.fixture
def bitgo_pending_approval_payload() -> dict:
    """BitGo PendingApproval サンプル"""
    return {
        "type": "pendingapproval",
        "pendingApprovalType": "transactionRequest",
        "pendingApprovalId": "699f00c775fb37ac72f7c6bc6634f7b0",
        "walletId": "6991a2b90ab0a888c75c1f62e52b822f",
    }


@pytest.fixture
def bitgo_tx_request_payload() -> dict:
    """BitGo TxRequest サンプル"""
    return {
        "enterpriseId": "6847dcb14c5a5791cc2986364d425d8b",
        "webhookType": "txRequest",
        "oldState": "initialized",
        "newState": "pendingDelivery",
    }


@pytest.fixture
def fireblocks_tx_payload() -> dict:
    """Fireblocks TX サンプル"""
    return {
        "id": "bef21d98-cda1-4071-8c46-e4d59a72f9b7",
        "workspaceId": "1b847ea6-5d7e-5adb-99ac-c54126d55be7",
        "eventType": "transaction.created",
        "data": {"status": "SUBMITTED"},
    }


@pytest.fixture
def fireblocks_wallet_payload() -> dict:
    """Fireblocks Wallet サンプル"""
    return {
        "id": "08e1edc8-75d2-4542-a914-7720e407a21e",
        "workspaceId": "1b847ea6-5d7e-5adb-99ac-c54126d55be7",
        "eventType": "vault_account.asset.balance_updated",
        "data": {"total": "0.28168507872804894"},
    }


@pytest.fixture
def alchemy_payload() -> dict:
    """Alchemy サンプル"""
    return {
        "webhookId": "wh_dd2o0ag81c0wh0tn",
        "id": "whevt_2jmw7m4r6m2fdcsg",
        "type": "GRAPHQL",
        "event": {
            "sequenceNumber": "10000000048367456006",
            "network": "MATIC_AMOY",
        },
    }


@pytest.fixture
def quicknode_payload() -> dict:
    """QuickNode サンプル"""
    return {
        "matchingReceipts": [
            {
                "blockHash": "0x25f77d3737727e929401c898263b7943e71e1d96b7c6753e3919a2ea6a5005c4",
                "transactionHash": "0x27e405f5d45865e8a148a8f6c16cabe06df8155667af7a1ce2751d530559d462",
            }
        ]
    }


@pytest.fixture
def fireblocks_notifications_payload() -> dict:
    """Fireblocks Notifications 形式サンプル（category/subject/event で分類）"""
    return {
        "note": "Created by Fireblocks Web3 Provider",
        "txId": "4563bf92-4b0a-4ac5-8ae5-a9760a66b1a7",
        "category": "Transactions",
        "subject": "Transaction",
        "event": "Submitted",
        "title": "Transaction - Submitted, optage2(testnet)",
        "asset": "AMOY_POLYGON_TEST",
    }


@pytest.fixture
def fireblocks_admin_notifications_payload() -> dict:
    """Fireblocks Administration 系 Notifications（eventKey なし）"""
    return {
        "category": "Administration",
        "subject": "Webhooks Notification",
        "event": "Created",
        "title": "Webhooks Notification - Created, optage2(testnet)",
        "user": "TestUser",
        "status": "Enabled",
    }


@pytest.fixture
def unknown_payload() -> dict:
    """unknown 分類用サンプル"""
    return {"foo": "bar", "random": 123}

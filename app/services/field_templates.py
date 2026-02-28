"""サービス別フィールド辞書テンプレート。
Fireblocks / BitGo など既知サービスの event_type ごとに主要フィールドの意味・注意点・参照先を定義する。
"""

from dataclasses import dataclass


@dataclass
class FieldDefinition:
    """フィールド辞書の1エントリ"""

    path: str  # JSONPath 風のパス（例: data.id, data.status）
    description: str  # フィールドの意味
    notes: str | None = None  # 注意点
    reference_url: str | None = None  # 公式ドキュメント等の参照先


# サービス別・event_type 別のフィールド辞書テンプレート
# 参照: https://developers.fireblocks.com/reference/webhooks-structures-eventtypes
# 参照: https://developers.bitgo.com/
FIELD_TEMPLATES: dict[str, dict[str, list[FieldDefinition]]] = {
    "fireblocks": {
        "transaction.created": [
            FieldDefinition(
                path="id",
                description="この Webhook イベントの一意な ID",
                notes="起票（トランザクション）単位の ID は data.id / resourceId を使用",
                reference_url="https://developers.fireblocks.com/reference/webhooks-structures-eventtypes-transaction",
            ),
            FieldDefinition(
                path="resourceId",
                description="トランザクション単位の一意な ID（起票ごとの固有値）",
                notes="data.id と同一。複数回の status 更新で共通",
                reference_url="https://developers.fireblocks.com/reference/webhook-v2-migration-guide",
            ),
            FieldDefinition(
                path="workspaceId",
                description="ワークスペースごとにユニークな ID",
                reference_url="https://developers.fireblocks.com/reference/webhooks-structures-eventtypes",
            ),
            FieldDefinition(
                path="eventType",
                description="イベント種類（transaction.created 等）",
                reference_url="https://developers.fireblocks.com/reference/webhooks-structures-eventtypes",
            ),
            FieldDefinition(
                path="data.id",
                description="トランザクションの一意な ID",
                notes="resourceId と同一。全ライフサイクルで不変",
                reference_url="https://developers.fireblocks.com/reference/webhooks-structures-eventtypes-transaction",
            ),
            FieldDefinition(
                path="data.status",
                description="トランザクションの主ステータス",
                notes="SUBMITTED→QUEUED→PENDING_SIGNATURE→...→CONFIRMING→COMPLETED / FAILED / CANCELLED",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects#status",
            ),
            FieldDefinition(
                path="data.subStatus",
                description="サブステータス（詳細状態）",
                notes="例: PENDING_BLOCKCHAIN_CONFIRMATIONS, CANCELLED_BY_USER",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects#substatus",
            ),
            FieldDefinition(
                path="data.txHash",
                description="ブロックチェーン上のトランザクションハッシュ",
                notes="BROADCASTING 以降で値が入る。最初は空",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects",
            ),
            FieldDefinition(
                path="data.amount",
                description="送信量（アセット単位）",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects",
            ),
            FieldDefinition(
                path="data.assetId",
                description="アセット識別子（例: MATIC_POLYGON, AMOY_POLYGON_TEST）",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects",
            ),
            FieldDefinition(
                path="data.operation",
                description="操作種別（TRANSFER, CONTRACT_CALL, MINT, BURN 等）",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects#operation",
            ),
            FieldDefinition(
                path="data.source",
                description="送信元（Vault / Internal Wallet 等）",
                notes="id, type, name を含むオブジェクト",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects",
            ),
            FieldDefinition(
                path="data.destination",
                description="送信先（Vault / External Wallet / One-Time Address 等）",
                notes="id が null の場合は One-Time Address",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects",
            ),
            FieldDefinition(
                path="data.destinationAddress",
                description="送信先アドレス（ブロックチェーンアドレス）",
                notes="External / One-Time の場合に設定",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects",
            ),
            FieldDefinition(
                path="data.networkFee",
                description="ネットワーク手数料",
                notes="BROADCASTING 以降で確定。初期値は -1",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects",
            ),
            FieldDefinition(
                path="data.createdAt",
                description="トランザクション作成時刻（ミリ秒 Unix）",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects",
            ),
            FieldDefinition(
                path="data.lastUpdated",
                description="最終更新時刻（ミリ秒 Unix）",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects",
            ),
            FieldDefinition(
                path="data.note",
                description="ユーザーが付与したメモ",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects",
            ),
        ],
        "transaction.status.updated": [
            # transaction.created と共通の主要フィールドを継承しつつ、status 更新に特化
            FieldDefinition(
                path="resourceId",
                description="トランザクション単位の一意な ID",
                notes="同一トランザクションの複数 status イベントで共通",
                reference_url="https://developers.fireblocks.com/reference/webhook-v2-migration-guide",
            ),
            FieldDefinition(
                path="eventType",
                description="イベント種類（transaction.status.updated）",
                reference_url="https://developers.fireblocks.com/reference/webhooks-structures-eventtypes",
            ),
            FieldDefinition(
                path="data.id",
                description="トランザクションの一意な ID",
                reference_url="https://developers.fireblocks.com/reference/webhooks-structures-eventtypes-transaction",
            ),
            FieldDefinition(
                path="data.status",
                description="トランザクションの主ステータス",
                notes="SUBMITTED→QUEUED→PENDING_SIGNATURE→BROADCASTING→CONFIRMING→COMPLETED",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects#status",
            ),
            FieldDefinition(
                path="data.subStatus",
                description="サブステータス",
                notes="PENDING_BLOCKCHAIN_CONFIRMATIONS, CANCELLED_BY_USER, INTERNAL_ERROR 等",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects#substatus",
            ),
            FieldDefinition(
                path="data.txHash",
                description="ブロックチェーン上のトランザクションハッシュ",
                notes="BROADCASTING で値が入る",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects",
            ),
            FieldDefinition(
                path="data.amount",
                description="送信量",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects",
            ),
            FieldDefinition(
                path="data.assetId",
                description="アセット識別子",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects",
            ),
            FieldDefinition(
                path="data.operation",
                description="操作種別",
                reference_url="https://developers.fireblocks.com/reference/transaction-objects#operation",
            ),
        ],
        "vault_account.created": [
            FieldDefinition(
                path="eventType",
                description="イベント種類（vault_account.created）",
                reference_url="https://developers.fireblocks.com/reference/webhooks-structures-eventtypes-wallet",
            ),
            FieldDefinition(
                path="data",
                description="Vault アカウント作成の詳細データ",
                reference_url="https://developers.fireblocks.com/reference/webhooks-structures-eventtypes-wallet",
            ),
        ],
        "vault_account.asset.balance_updated": [
            FieldDefinition(
                path="eventType",
                description="イベント種類（vault_account.asset.balance_updated）",
                reference_url="https://developers.fireblocks.com/reference/webhooks-structures-eventtypes-wallet",
            ),
            FieldDefinition(
                path="data",
                description="残高更新の詳細（total 等）",
                reference_url="https://developers.fireblocks.com/reference/webhooks-structures-eventtypes-wallet",
            ),
        ],
    },
    "bitgo": {
        "transfer": [
            FieldDefinition(
                path="type",
                description="Webhook の種類（transfer）",
                reference_url="https://developers.bitgo.com/",
            ),
            FieldDefinition(
                path="coin",
                description="アセット種別",
                reference_url="https://developers.bitgo.com/",
            ),
            FieldDefinition(
                path="wallet",
                description="ウォレット情報",
                reference_url="https://developers.bitgo.com/",
            ),
        ],
        "pendingapproval": [
            FieldDefinition(
                path="type",
                description="Webhook の種類（pendingapproval）",
                reference_url="https://developers.bitgo.com/",
            ),
            FieldDefinition(
                path="pendingApprovalType",
                description="承認待ちの種類（例: transactionRequest）",
                reference_url="https://developers.bitgo.com/",
            ),
            FieldDefinition(
                path="pendingApprovalId",
                description="承認待ちエンティティの ID",
                reference_url="https://developers.bitgo.com/",
            ),
            FieldDefinition(
                path="walletId",
                description="ウォレット ID",
                reference_url="https://developers.bitgo.com/",
            ),
            FieldDefinition(
                path="walletLabel",
                description="ウォレット表示名",
                reference_url="https://developers.bitgo.com/",
            ),
            FieldDefinition(
                path="state",
                description="現在の状態（pending, approved 等）",
                reference_url="https://developers.bitgo.com/",
            ),
        ],
        "txrequest": [
            FieldDefinition(
                path="webhookType",
                description="Webhook の種類（txRequest）",
                reference_url="https://developers.bitgo.com/",
            ),
            FieldDefinition(
                path="enterpriseId",
                description="エンタープライズ ID",
                reference_url="https://developers.bitgo.com/",
            ),
            FieldDefinition(
                path="walletId",
                description="ウォレット ID",
                reference_url="https://developers.bitgo.com/",
            ),
            FieldDefinition(
                path="txRequestId",
                description="トランザクションリクエストの一意な ID",
                reference_url="https://developers.bitgo.com/",
            ),
            FieldDefinition(
                path="oldState",
                description="遷移前の状態",
                reference_url="https://developers.bitgo.com/",
            ),
            FieldDefinition(
                path="newState",
                description="遷移後の状態（例: initialized, pendingDelivery, delivered）",
                reference_url="https://developers.bitgo.com/",
            ),
        ],
    },
}


def get_field_template(source: str, event_type: str) -> list[FieldDefinition] | None:
    """
    指定した source と event_type に対応するフィールド辞書テンプレートを返す。
    未対応の場合は None を返す。
    """
    source_lower = source.lower().strip()
    event_lower = event_type.lower().strip()
    by_source = FIELD_TEMPLATES.get(source_lower)
    if not by_source:
        return None
    # 完全一致を試す
    template = by_source.get(event_lower)
    if template is not None:
        return template
    # Fireblocks: transaction.status.updated 等のドット区切りで正規化
    event_normalized = event_lower.replace(" ", ".")
    return by_source.get(event_normalized)

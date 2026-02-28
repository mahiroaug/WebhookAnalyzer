# BitGo Wallet Webhook

## pendingApproval

```json
{
  "type": "pendingapproval",
  "pendingApprovalType": "transactionRequest",
  "pendingApprovalId": "699f00c775fb37ac72f7c6bc6634f7b0",
  "walletId": "6991a2b90ab0a888c75c1f62e52b822f",
  "walletLabel": "mahiro-wallet02-self-multisig-hot",
  "state": "pending",
  "simulation": false
}
```

```json
{
  "type": "pendingapproval",
  "pendingApprovalType": "transactionRequest",
  "pendingApprovalId": "699f00c775fb37ac72f7c6bc6634f7b0",
  "walletId": "6991a2b90ab0a888c75c1f62e52b822f",
  "walletLabel": "mahiro-wallet02-self-multisig-hot",
  "state": "approved",
  "simulation": false
}
```

## TxRequest

### 01. initialized -> pendingDelivery

```json
{
  "enterpriseId": "6847dcb14c5a5791cc2986364d425d8b",
  "organizationId": "6847dcb24c5a5791cc29867e",
  "walletId": "69897779129febb7e2f31f6407b2f459",
  "txRequestId": "df0fa622-17f8-4373-9873-25be0ab53ee5",
  "txRequestVersion": 4,
  "webhookType": "txRequest",
  "sequenceIds": ["4UoKSf9AoUWgmHGdXNCvBT25NpiN"],
  "oldState": "initialized",
  "newState": "pendingDelivery"
}
```

### 02. pendingDelivery -> delivered

```json
{
  "enterpriseId": "6847dcb14c5a5791cc2986364d425d8b",
  "organizationId": "6847dcb24c5a5791cc29867e",
  "walletId": "69897779129febb7e2f31f6407b2f459",
  "txRequestId": "df0fa622-17f8-4373-9873-25be0ab53ee5",
  "txRequestVersion": 11,
  "webhookType": "txRequest",
  "sequenceIds": ["4UoKSf9AoUWgmHGdXNCvBT25NpiN"],
  "oldState": "pendingDelivery",
  "newState": "delivered"
}
```

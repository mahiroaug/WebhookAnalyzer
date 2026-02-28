# Wallet Webhook

## Transfer

### send tx

```json
{
  "hash": "0x7fff5b5064390815ad42526d8e1c03372fc473d550c073cf87fa8dc186cf2959",
  "transfer": "6989f7bafbbe2bc87d1cab0cbb528b15",
  "coin": "tpolygon",
  "type": "transfer",
  "state": "confirmed",
  "wallet": "69897779129febb7e2f31f6407b2f459",
  "walletType": "hot",
  "transferType": "send",
  "baseValue": -100000000000000000,
  "baseValueString": "-100000000000000000",
  "value": -102457000001323000,
  "valueString": "-102457000001323000",
  "feeString": "2457000001323000",
  "initiator": [
    "69799af5dd1cd4c2a892fe140ce52760"
  ],
  "sequenceId": "4UoKSf9AoUWgmHGdXNCvBT25NpiN",
  "systemNotes": {
    "warning": "Do not rely solely on this webhook for final state. Always verify the current status via the API to ensure consistency. View the BitGo developer documentation and guides for more information."
  }
}
```


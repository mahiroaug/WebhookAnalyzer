# Transaction Created Event (Webhook v2)

v2の解説は↓らへん

[Webhook v2 Migration Guide](https://developers.fireblocks.com/reference/webhook-v2-migration-guide#notifications-object-differentiation)

- いわゆるTransactionIDはTxHashに入る。最初は空でBROADCASTINGにて値が入る
- resourceId=data.idが起票ごとの固有値として使える
- workspaceIdはワークスペースごとにユニークの値

```json
2025-04-06T12:06:40.618Z	6df5a5ea-3526-4fd1-9906-26c702a61f18	INFO	Validated webhook event: {
    "id": "bef21d98-cda1-4071-8c46-e4d59a72f9b7",
    "resourceId": "569feac0-c2c3-42bb-bb91-378e0fe5cb48",
    "workspaceId": "1b847ea6-5d7e-5adb-99ac-c54126d55be7",
    "eventType": "transaction.created",
    "data": {
        "note": "Transfer on Polygon Amoy testnet",
        "amountUSD": 0,
        "destinationAddress": "",
        "signedBy": [],
        "networkFee": -1,
        "destinationTag": "",
        "fee": -1,
        "destination": {
            "name": "MTools_Alice",
            "subType": "",
            "id": "1189",
            "type": "VAULT_ACCOUNT"
        },
        "feeCurrency": "AMOY_POLYGON_TEST",
        "source": {
            "name": "MTools_Bob",
            "subType": "",
            "id": "1190",
            "type": "VAULT_ACCOUNT"
        },
        "externalTxId": null,
        "createdAt": 1743941199193,
        "lastUpdated": 1743941199193,
        "feeInfo": {},
        "assetId": "AMOY_POLYGON_TEST",
        "id": "569feac0-c2c3-42bb-bb91-378e0fe5cb48",
        "txHash": "",
        "blockInfo": {},
        "amount": 0.01,
        "sourceAddress": "",
        "netAmount": -1,
        "addressType": "",
        "destinations": [],
        "signedMessages": [],
        "amountInfo": {
            "amount": "0.01",
            "requestedAmount": "0.01",
            "amountUSD": "0.00"
        },
        "customerRefId": null,
        "subStatus": "",
        "assetType": "BASE_ASSET",
        "rejectedBy": "",
        "createdBy": "60895bff-457a-49da-977e-7bbe7698a73b",
        "exchangeTxId": "",
        "destinationAddressDescription": "",
        "requestedAmount": 0.01,
        "operation": "TRANSFER",
        "status": "SUBMITTED"
    },
    "createdAt": 1743941199578
}
```

`transaction.status.updated`

- networkFeeなどのパラメータがちょっとずつ付加されていく

```json
2025-04-06T12:06:41.560Z	35f142d1-7a5c-4b13-94f6-6f61fbbe24f1	INFO	Validated webhook event: {
    "id": "8bd5d307-1ecf-41ab-bf9e-d05fb7599ab1",
    "resourceId": "569feac0-c2c3-42bb-bb91-378e0fe5cb48",
    "workspaceId": "1b847ea6-5d7e-5adb-99ac-c54126d55be7",
    "eventType": "transaction.status.updated",
    "data": {
        "note": "Transfer on Polygon Amoy testnet",
        "amountUSD": 0,
        "destinationAddress": "",
        "signedBy": [],
        "networkFee": -1,
        "destinationTag": "",
        "fee": -1,
        "destination": {
            "name": "MTools_Alice",
            "subType": "",
            "id": "1189",
            "type": "VAULT_ACCOUNT"
        },
        "feeCurrency": "AMOY_POLYGON_TEST",
        "source": {
            "name": "MTools_Bob",
            "subType": "",
            "id": "1190",
            "type": "VAULT_ACCOUNT"
        },
        "externalTxId": null,
        "createdAt": 1743941199193,
        "lastUpdated": 1743941200468,
        "feeInfo": {},
        "assetId": "AMOY_POLYGON_TEST",
        "id": "569feac0-c2c3-42bb-bb91-378e0fe5cb48",
        "txHash": "",
        "blockInfo": {},
        "amount": 0.01,
        "sourceAddress": "",
        "netAmount": -1,
        "addressType": "",
        "destinations": [],
        "signedMessages": [],
        "amountInfo": {
            "amount": "0.01",
            "requestedAmount": "0.01",
            "amountUSD": "0.00"
        },
        "customerRefId": null,
        "subStatus": "",
        "assetType": "BASE_ASSET",
        "rejectedBy": "",
        "createdBy": "60895bff-457a-49da-977e-7bbe7698a73b",
        "exchangeTxId": "",
        "destinationAddressDescription": "",
        "requestedAmount": 0.01,
        "operation": "TRANSFER",
        "status": "QUEUED"
    },
    "createdAt": 1743941200530
}

```

```json
2025-04-06T12:06:41.811Z	c8003ef8-f2c7-48f0-945b-c9b269b2bd3e	INFO	Validated webhook event: {
    "id": "3eccc1a8-0b4b-466d-b4df-001fc09c747d",
    "resourceId": "569feac0-c2c3-42bb-bb91-378e0fe5cb48",
    "workspaceId": "1b847ea6-5d7e-5adb-99ac-c54126d55be7",
    "eventType": "transaction.status.updated",
    "data": {
        "note": "Transfer on Polygon Amoy testnet",
        "amountUSD": 0,
        "destinationAddress": "",
        "signedBy": [],
        "networkFee": -1,
        "destinationTag": "",
        "fee": -1,
        "destination": {
            "name": "MTools_Alice",
            "subType": "",
            "id": "1189",
            "type": "VAULT_ACCOUNT"
        },
        "feeCurrency": "AMOY_POLYGON_TEST",
        "source": {
            "name": "MTools_Bob",
            "subType": "",
            "id": "1190",
            "type": "VAULT_ACCOUNT"
        },
        "externalTxId": null,
        "createdAt": 1743941199193,
        "lastUpdated": 1743941201519,
        "feeInfo": {},
        "assetId": "AMOY_POLYGON_TEST",
        "id": "569feac0-c2c3-42bb-bb91-378e0fe5cb48",
        "txHash": "",
        "blockInfo": {},
        "amount": 0.01,
        "sourceAddress": "",
        "netAmount": -1,
        "addressType": "",
        "destinations": [],
        "signedMessages": [],
        "amountInfo": {
            "amount": "0.01",
            "requestedAmount": "0.01",
            "amountUSD": "0.00"
        },
        "customerRefId": null,
        "subStatus": "",
        "assetType": "BASE_ASSET",
        "rejectedBy": "",
        "createdBy": "60895bff-457a-49da-977e-7bbe7698a73b",
        "exchangeTxId": "",
        "destinationAddressDescription": "",
        "requestedAmount": 0.01,
        "operation": "TRANSFER",
        "status": "PENDING_SIGNATURE"
    },
    "createdAt": 1743941201590
}

```

```json
2025-04-06T12:06:45.026Z	64b0cf77-cd6c-46ae-9f1c-fe9a037878fb	INFO	Validated webhook event: {
    "id": "52d5a3f2-6bcb-417d-abb8-7e90b9012b50",
    "resourceId": "569feac0-c2c3-42bb-bb91-378e0fe5cb48",
    "workspaceId": "1b847ea6-5d7e-5adb-99ac-c54126d55be7",
    "eventType": "transaction.status.updated",
    "data": {
        "note": "Transfer on Polygon Amoy testnet",
        "amountUSD": 0.00184749,
        "destinationAddress": "0x464e926AfB9E8c5D7F18B92C7dBA01399aa0d265",
        "signedBy": [
            "60895bff-457a-49da-977e-7bbe7698a73b"
        ],
        "networkFee": 0.002102079000378,
        "destinationTag": "",
        "fee": 0.002102079000378,
        "destination": {
            "name": "MTools_Alice",
            "subType": "",
            "id": "1189",
            "type": "VAULT_ACCOUNT"
        },
        "feeCurrency": "AMOY_POLYGON_TEST",
        "source": {
            "name": "MTools_Bob",
            "subType": "",
            "id": "1190",
            "type": "VAULT_ACCOUNT"
        },
        "externalTxId": null,
        "createdAt": 1743941199193,
        "lastUpdated": 1743941204790,
        "feeInfo": {
            "networkFee": "0.002102079000378000"
        },
        "assetId": "AMOY_POLYGON_TEST",
        "id": "569feac0-c2c3-42bb-bb91-378e0fe5cb48",
        "txHash": "0xda53fcf37565b945bb74c839016e77d25a64005aea1be2f4e098adf4c21a6326",
        "blockInfo": {
            "blockHash": null
        },
        "amount": 0.01,
        "sourceAddress": "",
        "netAmount": 0.01,
        "addressType": "",
        "destinations": [],
        "signedMessages": [],
        "index": 0,
        "amountInfo": {
            "amount": "0.01",
            "requestedAmount": "0.01",
            "amountUSD": "0.00184749",
            "netAmount": "0.01"
        },
        "customerRefId": null,
        "subStatus": "",
        "assetType": "BASE_ASSET",
        "rejectedBy": "",
        "numOfConfirmations": 0,
        "createdBy": "60895bff-457a-49da-977e-7bbe7698a73b",
        "exchangeTxId": "",
        "destinationAddressDescription": "",
        "requestedAmount": 0.01,
        "operation": "TRANSFER",
        "status": "BROADCASTING"
    },
    "createdAt": 1743941204897
}

```

```json
2025-04-06T12:06:46.564Z	e4933c69-92cb-4ac1-aa5f-cf18617b7ffe	INFO	Validated webhook event: {
    "id": "67fdfc27-ea97-4117-88d6-5a76c30782ff",
    "resourceId": "569feac0-c2c3-42bb-bb91-378e0fe5cb48",
    "workspaceId": "1b847ea6-5d7e-5adb-99ac-c54126d55be7",
    "eventType": "transaction.status.updated",
    "data": {
        "note": "Transfer on Polygon Amoy testnet",
        "amountUSD": 0.00184749,
        "destinationAddress": "0x464e926AfB9E8c5D7F18B92C7dBA01399aa0d265",
        "signedBy": [
            "60895bff-457a-49da-977e-7bbe7698a73b"
        ],
        "networkFee": 0.002102079000378,
        "destinationTag": "",
        "fee": 0.002102079000378,
        "destination": {
            "name": "MTools_Alice",
            "subType": "",
            "id": "1189",
            "type": "VAULT_ACCOUNT"
        },
        "feeCurrency": "AMOY_POLYGON_TEST",
        "source": {
            "name": "MTools_Bob",
            "subType": "",
            "id": "1190",
            "type": "VAULT_ACCOUNT"
        },
        "externalTxId": null,
        "createdAt": 1743941199193,
        "lastUpdated": 1743941206308,
        "feeInfo": {
            "networkFee": "0.002102079000378000"
        },
        "assetId": "AMOY_POLYGON_TEST",
        "id": "569feac0-c2c3-42bb-bb91-378e0fe5cb48",
        "txHash": "0xda53fcf37565b945bb74c839016e77d25a64005aea1be2f4e098adf4c21a6326",
        "blockInfo": {
            "blockHash": null
        },
        "amount": 0.01,
        "sourceAddress": "",
        "netAmount": 0.01,
        "addressType": "",
        "destinations": [],
        "signedMessages": [],
        "index": 0,
        "amountInfo": {
            "amount": "0.01",
            "requestedAmount": "0.01",
            "amountUSD": "0.00184749",
            "netAmount": "0.01"
        },
        "customerRefId": null,
        "subStatus": "PENDING_BLOCKCHAIN_CONFIRMATIONS",
        "assetType": "BASE_ASSET",
        "rejectedBy": "",
        "numOfConfirmations": 0,
        "createdBy": "60895bff-457a-49da-977e-7bbe7698a73b",
        "exchangeTxId": "",
        "destinationAddressDescription": "",
        "requestedAmount": 0.01,
        "operation": "TRANSFER",
        "status": "CONFIRMING"
    },
    "createdAt": 1743941206416
}

```

## Contract Call

### mahiroNFT_V2 (whitelited) PENDING_AUTHORIZATION

```json
2025-04-09T09:13:43.403Z	4c793e8e-3405-4415-87c7-d483d5d93657	INFO	Validated webhook event: {
    "id": "bf515be0-45ae-46a5-9388-72c5b37e4c38",
    "resourceId": "0bf7ac1e-c7de-4ce4-b18b-29aab41afc62",
    "workspaceId": "6f9be691-da62-5fdb-bdbd-7a3ae32ea878",
    "eventType": "transaction.status.updated",
    "data": {
        "note": "NFT approve: 0x084466a05dfeb359E57f985F1B0a1EbabBE77e9A for token 6 (Vault ID: 303)",
        "amountUSD": 0,
        "authorizationInfo": {
            "allowOperatorAsAuthorizer": false,
            "groups": [
                {
                    "th": 1,
                    "users": {
                        "46791871-dc7e-5ece-b3b4-a232d1d6290c": "PENDING_AUTHORIZATION"
                    }
                }
            ],
            "logic": "OR"
        },
        "destinationAddress": "",
        "contractCallDecodedData": {
            "functionCalls": [
                {
                    "name": "approve",
                    "params": [
                        {
                            "name": "to",
                            "type": "address",
                            "value": "0x084466a05dfeb359E57f985F1B0a1EbabBE77e9A"
                        },
                        {
                            "name": "tokenId",
                            "type": "uint256",
                            "value": "6"
                        }
                    ],
                    "payloadSuffix": ""
                }
            ],
            "contractName": "mahiroNFT_V2"
        },
        "signedBy": [],
        "networkFee": 0,
        "destinationTag": "",
        "fee": 0,
        "destination": {
            "name": "N/A",
            "subType": "",
            "id": "2ea1774b-3ae6-44c5-b93f-f59b519577d2",
            "type": "INTERNAL_WALLET"
        },
        "feeCurrency": "AMOY_POLYGON_TEST",
        "extraParameters": {
            "gasLimit": "3000000",
            "contractCallData": "0x095ea7b3000000000000000000000000084466a05dfeb359e57f985f1b0a1ebabbe77e9a0000000000000000000000000000000000000000000000000000000000000006",
            "gasPrice": "20000000000"
        },
        "source": {
            "name": "MTool2_dave",
            "subType": "",
            "id": "306",
            "type": "VAULT_ACCOUNT"
        },
        "externalTxId": null,
        "networkRecords": [],
        "createdAt": 1744190021337,
        "lastUpdated": 1744190022173,
        "feeInfo": {
            "networkFee": "0"
        },
        "assetId": "AMOY_POLYGON_TEST",
        "id": "0bf7ac1e-c7de-4ce4-b18b-29aab41afc62",
        "txHash": "",
        "blockInfo": {},
        "amount": 0,
        "sourceAddress": "",
        "netAmount": 0,
        "addressType": "",
        "signedMessages": [],
        "amountInfo": {
            "amount": "0",
            "requestedAmount": "0",
            "amountUSD": "0.00",
            "netAmount": "0"
        },
        "subStatus": "",
        "assetType": "BASE_ASSET",
        "rejectedBy": "",
        "createdBy": "134b2fdf-c3d7-49eb-9572-2d56434819e4",
        "exchangeTxId": "",
        "destinationAddressDescription": "",
        "requestedAmount": 0,
        "operation": "CONTRACT_CALL",
        "status": "PENDING_AUTHORIZATION"
    },
    "createdAt": 1744190022243
}

```

### mahiroNFT_V2 (whitelited) PENDING_SIGNATURE

```json
2025-04-09T09:17:14.773Z	1dd98f12-06da-4024-9d9b-f94c9807cb9c	INFO	Validated webhook event: {
    "id": "1a65efbc-2d5c-453e-89a6-88d77df5169d",
    "resourceId": "0bf7ac1e-c7de-4ce4-b18b-29aab41afc62",
    "workspaceId": "6f9be691-da62-5fdb-bdbd-7a3ae32ea878",
    "eventType": "transaction.status.updated",
    "data": {
        "note": "NFT approve: 0x084466a05dfeb359E57f985F1B0a1EbabBE77e9A for token 6 (Vault ID: 303)",
        "amountUSD": 0,
        "authorizationInfo": {
            "allowOperatorAsAuthorizer": false,
            "groups": [
                {
                    "th": 1,
                    "users": {
                        "46791871-dc7e-5ece-b3b4-a232d1d6290c": "APPROVED"
                    }
                }
            ],
            "logic": "OR"
        },
        "destinationAddress": "",
        "contractCallDecodedData": {
            "functionCalls": [
                {
                    "name": "approve",
                    "params": [
                        {
                            "name": "to",
                            "type": "address",
                            "value": "0x084466a05dfeb359E57f985F1B0a1EbabBE77e9A"
                        },
                        {
                            "name": "tokenId",
                            "type": "uint256",
                            "value": "6"
                        }
                    ],
                    "payloadSuffix": ""
                }
            ],
            "contractName": "mahiroNFT_V2"
        },
        "signedBy": [],
        "networkFee": 0,
        "destinationTag": "",
        "fee": 0,
        "destination": {
            "name": "N/A",
            "subType": "",
            "id": "2ea1774b-3ae6-44c5-b93f-f59b519577d2",
            "type": "INTERNAL_WALLET"
        },
        "feeCurrency": "AMOY_POLYGON_TEST",
        "extraParameters": {
            "gasLimit": "3000000",
            "contractCallData": "0x095ea7b3000000000000000000000000084466a05dfeb359e57f985f1b0a1ebabbe77e9a0000000000000000000000000000000000000000000000000000000000000006",
            "gasPrice": "20000000000"
        },
        "source": {
            "name": "MTool2_dave",
            "subType": "",
            "id": "306",
            "type": "VAULT_ACCOUNT"
        },
        "externalTxId": null,
        "networkRecords": [],
        "createdAt": 1744190021337,
        "lastUpdated": 1744190234520,
        "feeInfo": {
            "networkFee": "0"
        },
        "assetId": "AMOY_POLYGON_TEST",
        "id": "0bf7ac1e-c7de-4ce4-b18b-29aab41afc62",
        "txHash": "",
        "blockInfo": {},
        "amount": 0,
        "sourceAddress": "",
        "netAmount": 0,
        "addressType": "",
        "signedMessages": [],
        "amountInfo": {
            "amount": "0",
            "requestedAmount": "0",
            "amountUSD": "0.00",
            "netAmount": "0"
        },
        "subStatus": "",
        "assetType": "BASE_ASSET",
        "rejectedBy": "",
        "createdBy": "134b2fdf-c3d7-49eb-9572-2d56434819e4",
        "exchangeTxId": "",
        "destinationAddressDescription": "",
        "requestedAmount": 0,
        "operation": "CONTRACT_CALL",
        "status": "PENDING_SIGNATURE"
    },
    "createdAt": 1744190234613
}

```

### mahiroNFT (OneTimeAddress) PENDING_AUTHORIZATION

```json
2025-04-09T09:38:19.824Z	488ad2f7-6790-431a-929b-bc15bc2983bd	INFO	Validated webhook event: {
    "id": "d96d76d3-e29a-4df6-97fb-2f4ba019eb3d",
    "resourceId": "252e8639-e98c-4dbd-ab18-b6fc1ec0e825",
    "workspaceId": "6f9be691-da62-5fdb-bdbd-7a3ae32ea878",
    "eventType": "transaction.status.updated",
    "data": {
        "note": "NFT approve: 0x084466a05dfeb359E57f985F1B0a1EbabBE77e9A for token 4 (Vault ID: 303)",
        "amountUSD": 0,
        "authorizationInfo": {
            "allowOperatorAsAuthorizer": false,
            "groups": [
                {
                    "th": 1,
                    "users": {
                        "46791871-dc7e-5ece-b3b4-a232d1d6290c": "PENDING_AUTHORIZATION"
                    }
                }
            ],
            "logic": "OR"
        },
        "destinationAddress": "",
        "contractCallDecodedData": {
            "functionCalls": [
                {
                    "name": "approve",
                    "params": [
                        {
                            "name": "to",
                            "type": "address",
                            "value": "0x084466a05dfeb359E57f985F1B0a1EbabBE77e9A"
                        },
                        {
                            "name": "tokenId",
                            "type": "uint256",
                            "value": "4"
                        }
                    ],
                    "payloadSuffix": ""
                }
            ],
            "contractName": "mahiroNFT"
        },
        "signedBy": [],
        "networkFee": 0,
        "destinationTag": "",
        "fee": 0,
        "destination": {
            "name": "N/A",
            "subType": "",
            "id": null,
            "type": "ONE_TIME_ADDRESS"
        },
        "feeCurrency": "AMOY_POLYGON_TEST",
        "extraParameters": {
            "gasLimit": "3000000",
            "contractCallData": "0x095ea7b3000000000000000000000000084466a05dfeb359e57f985f1b0a1ebabbe77e9a0000000000000000000000000000000000000000000000000000000000000004",
            "gasPrice": "20000000000"
        },
        "source": {
            "name": "MTool2_dave",
            "subType": "",
            "id": "306",
            "type": "VAULT_ACCOUNT"
        },
        "externalTxId": null,
        "networkRecords": [],
        "createdAt": 1744191498518,
        "lastUpdated": 1744191499290,
        "feeInfo": {
            "networkFee": "0"
        },
        "assetId": "AMOY_POLYGON_TEST",
        "id": "252e8639-e98c-4dbd-ab18-b6fc1ec0e825",
        "txHash": "",
        "blockInfo": {},
        "amount": 0,
        "sourceAddress": "",
        "netAmount": 0,
        "addressType": "",
        "signedMessages": [],
        "amountInfo": {
            "amount": "0",
            "requestedAmount": "0",
            "amountUSD": "0.00",
            "netAmount": "0"
        },
        "subStatus": "",
        "assetType": "BASE_ASSET",
        "rejectedBy": "",
        "createdBy": "134b2fdf-c3d7-49eb-9572-2d56434819e4",
        "exchangeTxId": "",
        "destinationAddressDescription": "",
        "requestedAmount": 0,
        "operation": "CONTRACT_CALL",
        "status": "PENDING_AUTHORIZATION"
    },
    "createdAt": 1744191499400
}

```

### mahiroNFT (OneTimeAddress) PENDING_SIGNATURE

```json
2025-04-09T09:36:32.780Z	d67daa6e-b985-46a7-b9dc-291e9b8cd552	INFO	Validated webhook event: {
    "id": "84c38931-1ac9-4300-8877-949814dccaaf",
    "resourceId": "892b5a35-6944-428b-ad34-6304b1253440",
    "workspaceId": "6f9be691-da62-5fdb-bdbd-7a3ae32ea878",
    "eventType": "transaction.status.updated",
    "data": {
        "note": "NFT approve: 0x084466a05dfeb359E57f985F1B0a1EbabBE77e9A for token 4 (Vault ID: 303)",
        "amountUSD": 0,
        "authorizationInfo": {
            "allowOperatorAsAuthorizer": false,
            "groups": [
                {
                    "th": 1,
                    "users": {
                        "46791871-dc7e-5ece-b3b4-a232d1d6290c": "APPROVED"
                    }
                }
            ],
            "logic": "OR"
        },
        "destinationAddress": "",
        "contractCallDecodedData": {
            "functionCalls": [
                {
                    "name": "approve",
                    "params": [
                        {
                            "name": "to",
                            "type": "address",
                            "value": "0x084466a05dfeb359E57f985F1B0a1EbabBE77e9A"
                        },
                        {
                            "name": "tokenId",
                            "type": "uint256",
                            "value": "4"
                        }
                    ],
                    "payloadSuffix": ""
                }
            ],
            "contractName": "mahiroNFT"
        },
        "signedBy": [],
        "networkFee": 0,
        "destinationTag": "",
        "fee": 0,
        "destination": {
            "name": "N/A",
            "subType": "",
            "id": null,
            "type": "ONE_TIME_ADDRESS"
        },
        "feeCurrency": "AMOY_POLYGON_TEST",
        "extraParameters": {
            "gasLimit": "3000000",
            "contractCallData": "0x095ea7b3000000000000000000000000084466a05dfeb359e57f985f1b0a1ebabbe77e9a0000000000000000000000000000000000000000000000000000000000000004",
            "gasPrice": "20000000000"
        },
        "source": {
            "name": "MTool2_dave",
            "subType": "",
            "id": "306",
            "type": "VAULT_ACCOUNT"
        },
        "externalTxId": null,
        "networkRecords": [],
        "createdAt": 1744191389177,
        "lastUpdated": 1744191391847,
        "feeInfo": {
            "networkFee": "0"
        },
        "assetId": "AMOY_POLYGON_TEST",
        "id": "892b5a35-6944-428b-ad34-6304b1253440",
        "txHash": "",
        "blockInfo": {},
        "amount": 0,
        "sourceAddress": "",
        "netAmount": 0,
        "addressType": "",
        "signedMessages": [],
        "amountInfo": {
            "amount": "0",
            "requestedAmount": "0",
            "amountUSD": "0.00",
            "netAmount": "0"
        },
        "subStatus": "",
        "assetType": "BASE_ASSET",
        "rejectedBy": "",
        "createdBy": "134b2fdf-c3d7-49eb-9572-2d56434819e4",
        "exchangeTxId": "",
        "destinationAddressDescription": "",
        "requestedAmount": 0,
        "operation": "CONTRACT_CALL",
        "status": "PENDING_SIGNATURE"
    },
    "createdAt": 1744191392644
}


```

## FAILED (after 24 hours)

```json
2025-04-10T09:36:03.752Z	5dd707fb-3cfe-42a4-a529-0c845e45509a	INFO	Validated webhook event: {
    "id": "61b26985-aab6-4c49-85aa-f63e9e15829f",
    "resourceId": "252e8639-e98c-4dbd-ab18-b6fc1ec0e825",
    "workspaceId": "6f9be691-da62-5fdb-bdbd-7a3ae32ea878",
    "eventType": "transaction.status.updated",
    "data": {
        "note": "NFT approve: 0x084466a05dfeb359E57f985F1B0a1EbabBE77e9A for token 4 (Vault ID: 303)",
        "amountUSD": 0,
        "authorizationInfo": {
            "allowOperatorAsAuthorizer": false,
            "groups": [
                {
                    "th": 1,
                    "users": {
                        "46791871-dc7e-5ece-b3b4-a232d1d6290c": "APPROVED"
                    }
                }
            ],
            "logic": "OR"
        },
        "destinationAddress": "",
        "contractCallDecodedData": {
            "functionCalls": [
                {
                    "name": "approve",
                    "params": [
                        {
                            "name": "to",
                            "type": "address",
                            "value": "0x084466a05dfeb359E57f985F1B0a1EbabBE77e9A"
                        },
                        {
                            "name": "tokenId",
                            "type": "uint256",
                            "value": "4"
                        }
                    ],
                    "payloadSuffix": ""
                }
            ],
            "contractName": "mahiroNFT"
        },
        "signedBy": [],
        "networkFee": 0,
        "destinationTag": "",
        "fee": 0,
        "destination": {
            "name": "N/A",
            "subType": "",
            "id": null,
            "type": "ONE_TIME_ADDRESS"
        },
        "feeCurrency": "AMOY_POLYGON_TEST",
        "extraParameters": {
            "gasLimit": "3000000",
            "contractCallData": "0x095ea7b3000000000000000000000000084466a05dfeb359e57f985f1b0a1ebabbe77e9a0000000000000000000000000000000000000000000000000000000000000004",
            "gasPrice": "20000000000"
        },
        "source": {
            "name": "MTool2_dave",
            "subType": "",
            "id": "306",
            "type": "VAULT_ACCOUNT"
        },
        "externalTxId": null,
        "networkRecords": [],
        "createdAt": 1744191498518,
        "lastUpdated": 1744277762655,
        "feeInfo": {
            "networkFee": "0"
        },
        "assetId": "AMOY_POLYGON_TEST",
        "id": "252e8639-e98c-4dbd-ab18-b6fc1ec0e825",
        "txHash": "",
        "blockInfo": {},
        "amount": 0,
        "sourceAddress": "",
        "netAmount": 0,
        "addressType": "",
        "signedMessages": [],
        "amountInfo": {
            "amount": "0",
            "requestedAmount": "0",
            "amountUSD": "0.00",
            "netAmount": "0"
        },
        "subStatus": "INTERNAL_ERROR",
        "assetType": "BASE_ASSET",
        "rejectedBy": "",
        "createdBy": "134b2fdf-c3d7-49eb-9572-2d56434819e4",
        "exchangeTxId": "",
        "destinationAddressDescription": "",
        "requestedAmount": 0,
        "operation": "CONTRACT_CALL",
        "status": "FAILED"
    },
    "createdAt": 1744277762755
}

```

# Transfer from Vault Account to External(Whitelisted)

```json
2025-04-18T09:17:11.125Z	6d169041-8b03-48c7-b1c5-b411babbdf19	INFO	Validated webhook event: {
    "id": "b9e06b03-3189-4833-9d77-f54534272823",
    "resourceId": "7d84bafc-1e4e-42bf-9769-c910ff56876c",
    "workspaceId": "6f9be691-da62-5fdb-bdbd-7a3ae32ea878",
    "eventType": "transaction.created",
    "data": {
        "note": "",
        "amountUSD": 0.02,
        "destinationAddress": "",
        "signedBy": [],
        "networkFee": -1,
        "destinationTag": "",
        "fee": -1,
        "destination": {
            "name": "mahiro_metamask16",
            "subType": "External",
            "id": "e93a7adf-6a30-425f-a2ba-afe01269763b",
            "type": "EXTERNAL_WALLET"
        },
        "feeCurrency": "AMOY_POLYGON_TEST",
        "source": {
            "name": "MTool2_Alice",
            "subType": "",
            "id": "303",
            "type": "VAULT_ACCOUNT"
        },
        "externalTxId": null,
        "createdAt": 1744967830586,
        "lastUpdated": 1744967830586,
        "feeInfo": {},
        "assetId": "AMOY_POLYGON_TEST",
        "id": "7d84bafc-1e4e-42bf-9769-c910ff56876c",
        "txHash": "",
        "blockInfo": {},
        "amount": 0.1,
        "sourceAddress": "",
        "netAmount": -1,
        "addressType": "WHITELISTED",
        "destinations": [],
        "signedMessages": [],
        "amountInfo": {
            "amount": "0.1",
            "requestedAmount": "0.1",
            "amountUSD": "0.02"
        },
        "customerRefId": null,
        "subStatus": "",
        "assetType": "BASE_ASSET",
        "rejectedBy": "",
        "createdBy": "46791871-dc7e-5ece-b3b4-a232d1d6290c",
        "exchangeTxId": "",
        "destinationAddressDescription": "",
        "requestedAmount": 0.1,
        "operation": "TRANSFER",
        "status": "SUBMITTED"
    },
    "createdAt": 1744967830693
}

```

```json
2025-04-18T09:17:12.522Z	526368ce-becd-4b70-b89d-8e06eda87171	INFO	Validated webhook event: {
    "id": "86b4af21-9f76-4b45-91d9-d0d9a2fd7329",
    "resourceId": "7d84bafc-1e4e-42bf-9769-c910ff56876c",
    "workspaceId": "6f9be691-da62-5fdb-bdbd-7a3ae32ea878",
    "eventType": "transaction.status.updated",
    "data": {
        "note": "",
        "amountUSD": 0.02,
        "destinationAddress": "",
        "signedBy": [],
        "networkFee": -1,
        "destinationTag": "",
        "fee": -1,
        "destination": {
            "name": "mahiro_metamask16",
            "subType": "External",
            "id": "e93a7adf-6a30-425f-a2ba-afe01269763b",
            "type": "EXTERNAL_WALLET"
        },
        "feeCurrency": "AMOY_POLYGON_TEST",
        "source": {
            "name": "MTool2_Alice",
            "subType": "",
            "id": "303",
            "type": "VAULT_ACCOUNT"
        },
        "externalTxId": null,
        "createdAt": 1744967830586,
        "lastUpdated": 1744967832277,
        "feeInfo": {},
        "assetId": "AMOY_POLYGON_TEST",
        "id": "7d84bafc-1e4e-42bf-9769-c910ff56876c",
        "txHash": "",
        "blockInfo": {},
        "amount": 0.1,
        "sourceAddress": "",
        "netAmount": -1,
        "addressType": "WHITELISTED",
        "destinations": [],
        "signedMessages": [],
        "amountInfo": {
            "amount": "0.1",
            "requestedAmount": "0.1",
            "amountUSD": "0.02"
        },
        "customerRefId": null,
        "subStatus": "",
        "assetType": "BASE_ASSET",
        "rejectedBy": "",
        "createdBy": "46791871-dc7e-5ece-b3b4-a232d1d6290c",
        "exchangeTxId": "",
        "destinationAddressDescription": "",
        "requestedAmount": 0.1,
        "operation": "TRANSFER",
        "status": "PENDING_SIGNATURE"
    },
    "createdAt": 1744967832387
}

```

# Transfer from Vault Account to External(OneTimeAddress)

````json
2025-04-18T09:08:35.713Z	71075605-b70f-471f-8026-2fd87053906d	INFO	Validated webhook event: {
    "id": "8c1308d4-0056-457f-8b0b-23b6540cbd31",
    "resourceId": "b2e74f7d-ee2f-495e-a86b-1185c7554eb9",
    "workspaceId": "6f9be691-da62-5fdb-bdbd-7a3ae32ea878",
    "eventType": "transaction.created",
    "data": {
        "note": "",
        "amountUSD": 0,
        "destinationAddress": "0x0c6b600869B1f7f4D5eE061B853731641615744c",
        "signedBy": [],
        "networkFee": -1,
        "destinationTag": "",
        "fee": -1,
        "destination": {
            "name": "N/A",
            "subType": "",
            "id": null,
            "type": "ONE_TIME_ADDRESS"
        },
        "feeCurrency": "AMOY_POLYGON_TEST",
        "source": {
            "name": "MTool2_Alice",
            "subType": "",
            "id": "303",
            "type": "VAULT_ACCOUNT"
        },
        "externalTxId": null,
        "createdAt": 1744967314573,
        "lastUpdated": 1744967314573,
        "feeInfo": {},
        "assetId": "AMOY_POLYGON_TEST",
        "id": "b2e74f7d-ee2f-495e-a86b-1185c7554eb9",
        "txHash": "",
        "blockInfo": {},
        "amount": 0.01,
        "sourceAddress": "",
        "netAmount": -1,
        "addressType": "",
        "destinations": [],
        "signedMessages": [],
        "amountInfo": {
            "amount": "0.01",
            "requestedAmount": "0.01",
            "amountUSD": "0.00"
        },
        "customerRefId": null,
        "subStatus": "",
        "assetType": "BASE_ASSET",
        "rejectedBy": "",
        "createdBy": "46791871-dc7e-5ece-b3b4-a232d1d6290c",
        "exchangeTxId": "",
        "destinationAddressDescription": "",
        "requestedAmount": 0.01,
        "operation": "TRANSFER",
        "status": "SUBMITTED"
    },
    "createdAt": 1744967314701
}








# Transaction Status Updated Event (Webhook v1) Deprecated

(ERC-20のTransafer)

```json
{
    "type": "TRANSACTION_STATUS_UPDATED",
    "tenantId": "a0509678-8c88-41d9-903d-c25a6b60eec5",
    "timestamp": 1739845384115,
    "data": {
        "id": "cdfa913f-e212-4f06-aebb-1969248f5393",
        "createdAt": 1739845283530,
        "lastUpdated": 1739845373730,
        "assetId": "C3T-JCS-1005401-2015_B6BBJ86Z_8FPY",
        "source": {
            "id": "4",
            "type": "VAULT_ACCOUNT",
            "name": "fbWallet4-4_KdjPoc",
            "subType": ""
        },
        "destination": {
            "id": "ec46dd70-85b4-47e9-b435-a296843eab6c",
            "type": "EXTERNAL_WALLET",
            "name": "J-Credit-Return",
            "subType": "External"
        },
        "amount": 1,
        "networkFee": 0.001729159959515696,
        "netAmount": 1,
        "sourceAddress": "",
        "destinationAddress": "0xb3eb5136c08ad28cc0c4bd1dc181ce52e791ae51",
        "destinationAddressDescription": "",
        "destinationTag": "",
        "status": "CONFIRMING",
        "txHash": "0x5940fa57d38501aab87c12c46a884f6331f9189a7a6e660e8a12fe971b74dc6c",
        "subStatus": "PENDING_BLOCKCHAIN_CONFIRMATIONS",
        "signedBy": [
            "3714b7f5-e3f9-413b-b459-480cc7ddefe7",
            "164813bc-5bfa-46ae-9f3d-9e8fda6f564a",
            "1c0c1220-9ac0-46ac-a6e6-8894abeb030c"
        ],
        "createdBy": "6939005c-50cb-4b2f-85bc-6fcdd77e931b",
        "rejectedBy": "",
        "amountUSD": null,
        "addressType": "WHITELISTED",
        "note": "",
        "exchangeTxId": "",
        "requestedAmount": 1,
        "feeCurrency": "MATIC_POLYGON",
        "operation": "TRANSFER",
        "customerRefId": "",
        "numOfConfirmations": 0,
        "amountInfo": {
            "amount": "1",
            "requestedAmount": "1",
            "netAmount": "1"
        },
        "feeInfo": {
            "networkFee": "0.001729159959515696"
        },
        "destinations": [],
        "externalTxId": null,
        "blockInfo": {
            "blockHash": null
        },
        "signedMessages": [],
        "amlScreeningResult": {
            "bypassReason": "BYPASSED_FAILURE",
            "customerRefId": "",
            "provider": "CHAINALYSIS_V2",
            "screeningStatus": "BYPASSED",
            "timestamp": 1739845284707,
            "verdict": "ACCEPT"
        },
        "complianceResults": {
            "aml": {
                "bypassReason": "BYPASSED_FAILURE",
                "customerRefId": "",
                "provider": "CHAINALYSIS_V2",
                "screeningStatus": "BYPASSED",
                "timestamp": 1739845284707,
                "verdict": "ACCEPT"
            },
            "tr": null,
            "amlList": [
                {
                    "bypassReason": "BYPASSED_FAILURE",
                    "customerRefId": "",
                    "provider": "CHAINALYSIS_V2",
                    "screeningStatus": "BYPASSED",
                    "timestamp": 1739845284707,
                    "verdict": "ACCEPT"
                }
            ],
            "status": "Completed",
            "amlRegistration": null
        },
        "authorizationInfo": {
            "allowOperatorAsAuthorizer": false,
            "logic": "OR",
            "groups": [
                {
                    "th": 2,
                    "users": {
                        "164813bc-5bfa-46ae-9f3d-9e8fda6f564a": "APPROVED",
                        "1c0c1220-9ac0-46ac-a6e6-8894abeb030c": "APPROVED",
                        "59b10026-20d1-4398-a5d8-f94515ca2065": "NA"
                    }
                },
                {
                    "th": 1,
                    "users": {
                        "1c0ca8e9-813a-4d22-ac9f-60a99b310433": "NA",
                        "4a826e80-014e-4551-a826-4d3bcb392677": "NA",
                        "c277e64e-25ce-45b8-898f-4c9c85f4575d": "NA"
                    }
                }
            ]
        },
        "assetType": "ERC20"
    }
}
````

キャンセルされた場合

```json
{
  "id": "2d1b30b3-c7a7-488e-ac72-a67a95a37226",
  "resourceId": "8f72db15-d96e-43fa-9e55-ebcd64169c57",
  "workspaceId": "6f9be691-da62-5fdb-bdbd-7a3ae32ea878",
  "eventType": "transaction.status.updated",
  "data": {
    "note": "NFT approve: 0x084466a05dfeb359E57f985F1B0a1EbabBE77e9A for token 6 (Vault ID: 303)",
    "amountUSD": 0,
    "authorizationInfo": {
      "allowOperatorAsAuthorizer": false,
      "groups": [
        {
          "th": 1,
          "users": {
            "46791871-dc7e-5ece-b3b4-a232d1d6290c": "NA",
            "1088f473-434c-42b0-a2ee-b05e10a28fd4": "NA",
            "7867dd77-ba66-4061-878c-157f1de74e4b": "NA"
          }
        }
      ],
      "logic": "OR"
    },
    "destinationAddress": "",
    "contractCallDecodedData": {
      "functionCalls": [
        {
          "name": "approve",
          "params": [
            {
              "name": "to",
              "type": "address",
              "value": "0x084466a05dfeb359E57f985F1B0a1EbabBE77e9A"
            },
            {
              "name": "tokenId",
              "type": "uint256",
              "value": "6"
            }
          ],
          "payloadSuffix": ""
        }
      ],
      "contractName": "mahiroNFT_V2"
    },
    "signedBy": [],
    "networkFee": 0,
    "destinationTag": "",
    "fee": 0,
    "destination": {
      "name": "N/A",
      "subType": "",
      "id": "2ea1774b-3ae6-44c5-b93f-f59b519577d2",
      "type": "INTERNAL_WALLET"
    },
    "feeCurrency": "AMOY_POLYGON_TEST",
    "extraParameters": {
      "gasLimit": "3000000",
      "contractCallData": "0x095ea7b3000000000000000000000000084466a05dfeb359e57f985f1b0a1ebabbe77e9a0000000000000000000000000000000000000000000000000000000000000006",
      "gasPrice": "20000000000"
    },
    "source": {
      "name": "MTool2_dave",
      "subType": "",
      "id": "306",
      "type": "VAULT_ACCOUNT"
    },
    "externalTxId": null,
    "networkRecords": [],
    "createdAt": 1744951772750,
    "lastUpdated": 1744952188394,
    "feeInfo": {
      "networkFee": "0"
    },
    "assetId": "AMOY_POLYGON_TEST",
    "id": "8f72db15-d96e-43fa-9e55-ebcd64169c57",
    "txHash": "",
    "blockInfo": {},
    "amount": 0,
    "sourceAddress": "",
    "netAmount": 0,
    "addressType": "",
    "signedMessages": [],
    "amountInfo": {
      "amount": "0",
      "requestedAmount": "0",
      "amountUSD": "0.00",
      "netAmount": "0"
    },
    "subStatus": "CANCELLED_BY_USER",
    "assetType": "BASE_ASSET",
    "rejectedBy": "",
    "createdBy": "1526e51f-8498-4dbb-b46f-a383936084e2",
    "exchangeTxId": "",
    "destinationAddressDescription": "",
    "requestedAmount": 0,
    "operation": "CONTRACT_CALL",
    "status": "CANCELLED"
  },
  "createdAt": 1744952188506
}
```

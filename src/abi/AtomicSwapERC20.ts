export const AtomicSwapERC20 = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "_hash",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "name": "_withdrawTrader",
        "type": "address"
      }
    ],
    "name": "Open",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "_hash",
        "type": "bytes32"
      }
    ],
    "name": "Expire",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "_hash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "name": "_secretKey",
        "type": "bytes"
      }
    ],
    "name": "Close",
    "type": "event"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_hash",
        "type": "bytes32"
      },
      {
        "name": "_erc20Value",
        "type": "uint256"
      },
      {
        "name": "_erc20ContractAddress",
        "type": "address"
      },
      {
        "name": "_withdrawTrader",
        "type": "address"
      },
      {
        "name": "_timelock",
        "type": "uint256"
      }
    ],
    "name": "open",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_hash",
        "type": "bytes32"
      },
      {
        "name": "_secretKey",
        "type": "bytes"
      }
    ],
    "name": "close",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_hash",
        "type": "bytes32"
      }
    ],
    "name": "expire",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_hash",
        "type": "bytes32"
      }
    ],
    "name": "check",
    "outputs": [
      {
        "name": "timelock",
        "type": "uint256"
      },
      {
        "name": "erc20Value",
        "type": "uint256"
      },
      {
        "name": "erc20ContractAddress",
        "type": "address"
      },
      {
        "name": "withdrawTrader",
        "type": "address"
      },
      {
        "name": "hash",
        "type": "bytes32"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_hash",
        "type": "bytes32"
      }
    ],
    "name": "checkSecretKey",
    "outputs": [
      {
        "name": "secretKey",
        "type": "bytes"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];
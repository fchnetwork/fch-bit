import { Component, Inject } from '@nestjs/common';
import { TransferDto } from '../dto/transfer.dto';
import { AccountService } from '../../account/services/account.service';
import { tokensABI } from './../../abi/tokens';
import { OrdersService } from '../../orders/orders.service';

const Tx = require('ethereumjs-tx');
const Web3 = require('web3');
const ethJsUtil = require('ethereumjs-util');

@Component()
export class TransactionsService {
  web3: any;

  constructor(
    private accountService: AccountService,
    private ordersService: OrdersService,
  ) {
    this.web3 = this.initWeb3();
  }

  initWeb3 = () => {
    return new Web3( new Web3.providers.WebsocketProvider(process.env.httpProvider));
  }

  updateTransaction(orderId, txHash, from, to) {
    this.ordersService.update(orderId, txHash, from, to);
  }

  async transfer(transactionData: TransferDto): Promise<any> {
    const sender = await this.accountService.getAddresses();
    return new Promise((resolve, reject) => {
      const data = this.web3.utils.asciiToHex( '' );
      transactionData.type = 'refund aero';
      this.ordersService.create(transactionData).then((orderRes) => {
        this.prepareTransaction(sender[transactionData.accountKey], transactionData.receiverAddress, transactionData.amount, data)
        .then((transferRes) => {
          resolve(transferRes);
          this.updateTransaction(orderRes._id, transferRes.transactionHash, sender[transactionData.accountKey], transactionData.receiverAddress);
        });
      });

    });
  }

  async transferTokens(transactionData: TransferDto): Promise<any> {
    const sender = await this.accountService.getAddresses();
    return new Promise((resolve, reject) => {
      const tokensContract = new this.web3.eth.Contract(tokensABI, transactionData.contractAddress, { from: sender[transactionData.accountKey], gas: 4000000});
      const data = tokensContract.methods.transfer(transactionData.receiverAddress, transactionData.amount).encodeABI();
      transactionData.type = 'refund token';
      const amount = 0;
      this.ordersService.create(transactionData).then((orderRes) => {
        this.prepareTransaction(sender[transactionData.accountKey], transactionData.contractAddress, amount, data)
        .then((transferRes) => {
          resolve(transferRes);
          this.updateTransaction(orderRes._id, transferRes.transactionHash, sender[transactionData.accountKey], transactionData.receiverAddress);
        });
      });

    });
  }

  prepareTransaction(sender, to, amount, data ): Promise<any> {
    return new Promise( (resolve, reject) => {
        const sendTo              = ethJsUtil.toChecksumAddress( to );
        const from                = ethJsUtil.toChecksumAddress( sender );
        const txValue             = this.web3.utils.numberToHex(this.web3.utils.toWei( amount.toString(), 'ether'));
        const txData              = data;
        const getGasPrice         = this.web3.eth.getGasPrice();
        const getTransactionCount = this.web3.eth.getTransactionCount( from );
        return Promise.all([getGasPrice, getTransactionCount])
        .then( (values) => {
              const gasPrice = values[0];
              const nonce = parseInt(values[1], 10);
              const gas = parseInt(values[2], 10);

              const rawTransaction: any = {
                from,
                nonce: this.web3.utils.toHex( nonce ),
                gasLimit: '0x3D0900',
                // TODO: export it to any config and import from there
                gasPrice: this.web3.utils.toHex( this.web3.utils.toWei( '1', 'gwei')),
                to: sendTo,
                value: txValue,
                data: txData,
              };
              this.preTransaction(rawTransaction).then((res) => {
                this.createTransaction(rawTransaction).then((response) => {
                  resolve(response);
                });
              }).catch((err) => {
                reject(err);
              });
        });
    });
  }

  createTransaction(rawTransaction){
    return new Promise((resolve, reject) => {
      const transaction = this.web3.eth.sendTransaction(rawTransaction).then((res) => {
        resolve(res);
      }).catch((err) => {
        console.log(err);
        reject(err);
      });
    });
  }

  preTransaction(rawTransaction){
    return new Promise((resolve, reject) => {
      const transaction = this.web3.eth.call(rawTransaction).then((res) => {
        resolve(res);
      }).catch((err) => {
        console.log(err);
        reject(err);
      });
    });
  }

  async startWatching(data) {
    const accounts = await this.accountService.getAddresses();
    const tokensContract = new this.web3.eth.Contract(tokensABI, data.contractAddress, { from: accounts[1], gas: 4000000});
    // console.dir(tokensContract);
    const transferEvent  = tokensContract.events.Transfer((res) => {
      console.log(res);
    });
    // console.dir(transferEvent);
    // transferEvent.watch((err, res) => {
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     console.log(res);
    //   }
    // });
  }

  payment(data) {
    return new Promise((resolve, reject) => {
      data.type = 'aero payment';
      this.ordersService.create(data).then((orderRes) => {
        this.startWatching(data);
        resolve(orderRes);
      });
    });
  }

  tokenPayment(data) {
    return new Promise((resolve, reject) => {
      data.type = 'token payment';
      this.ordersService.create(data).then((orderRes) => {
        this.startWatching(data);
        resolve(orderRes);
      });
    });
  }
}

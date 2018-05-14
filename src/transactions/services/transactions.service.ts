import { Component, Inject } from '@nestjs/common';
import { TransferEthDto } from '../dto/transfer-eth.dto';
import { AccountService } from '../../account/services/account.service';

const Tx = require('ethereumjs-tx');
const Web3 = require('web3');
const ethJsUtil = require('ethereumjs-util');

@Component()
export class TransactionsService {
  web3: any;

  constructor(private accountService: AccountService) {
    this.web3 = this.initWeb3();
  }

  initWeb3 = () => {
    return new Web3( new Web3.providers.HttpProvider(process.env.httpProvider));
  }

  // async createTransaction() {

  // }

  async transferEth(transactionData: TransferEthDto): Promise<any> {
    const sender = await this.accountService.getAddresses();
    return new Promise((resolve, reject) => {
      this.prepareTransaction(sender[transactionData.accountKey], transactionData.receiverAddress, transactionData.amount, '')
      .then((res) => {
        resolve(res);
      });
    });
    // return await transferEthDto;
  }

  prepareTransaction(sender, to, amount, data ): Promise<any> {
    return new Promise( (resolve, reject) => {
        const sendTo              = ethJsUtil.toChecksumAddress( to );
        const from                = ethJsUtil.toChecksumAddress( sender );
        const txValue             = this.web3.utils.numberToHex(this.web3.utils.toWei( amount.toString(), 'ether'));
        const txData              = this.web3.utils.asciiToHex( data );
        const getGasPrice         = this.web3.eth.getGasPrice();
        const getTransactionCount = this.web3.eth.getTransactionCount( from );
        const estimateGas         = this.web3.eth.estimateGas({to: sendTo, data: txData});

        return Promise.all([getGasPrice, getTransactionCount, estimateGas])
        .then( (values) => {
              const gasPrice = values[0];
              const nonce = parseInt(values[1], 10);
              const gas = parseInt(values[2], 10);

              const rawTransaction: any = {
                from,
                nonce: this.web3.utils.toHex( nonce ),
                gas: this.web3.utils.toHex( gas ),
                // TODO: export it to any config and import from there
                gasPrice: this.web3.utils.toHex( this.web3.utils.toWei( '1', 'gwei')),
                to,
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
        console.log('res transaction', res);
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
        reject(err);
      });
    });
  }
}

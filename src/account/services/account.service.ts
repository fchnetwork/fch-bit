import { Component, Inject } from '@nestjs/common';
import { tokensABI } from '../../abi/tokens';
import { WalletDto } from '../dto/wallet.dto';
const Web3 = require('web3');

const ethUtil = require('ethereumjs-util');
const hdkey   = require("ethereumjs-wallet/hdkey");
const bip39   = require("bip39");

@Component()
export class AccountService {
  web3: any;

  constructor() {
    this.web3 = this.initWeb3();
  }

  initWeb3 = () => {
    return new Web3( new Web3.providers.WebsocketProvider(process.env.aerumProvider));
  }

  async getAddresses() {
    const addresses = await this.web3.eth.getAccounts();
    return addresses;
  }

  async generateWallet(): Promise<WalletDto> {
    const newSeed = bip39.generateMnemonic();
    const mnemonicToSeed = bip39.mnemonicToSeed(newSeed);
    const hdwallet = hdkey.fromMasterSeed(mnemonicToSeed);
    const wallet = hdwallet.derivePath(process.env.derivationPath).getWallet();
    const getAddress = wallet.getAddress().toString('hex');
    const getPriv = wallet.getPrivateKeyString().toString('hex');
    const getPublic = wallet.getPublicKeyString().toString('hex');
    const getChecksumAddress = ethUtil.toChecksumAddress(getAddress);
    const address = ethUtil.addHexPrefix(getChecksumAddress);

    return {
      seed: newSeed,
      privateKey: getPriv,
      publicKey: getPublic,
      address: address
    };
  }

  async getBalance(acc): Promise<any> {
    const addresses = await this.getAddresses();
    const address = addresses[acc];
    const isAddress = await this.web3.utils.isAddress(address);
    if (isAddress) {
      const balance = await this.web3.eth.getBalance(address).then((res) => {
        return this.web3.utils.fromWei(res, 'ether');
      }).catch((err) => {
        return err;
      });
      return balance;
    } else {
      return 'Wrong aerum address';
    }
  }

  async getTokenBalance(acc, tokenAddress) {
    const addresses = await this.getAddresses();
    const address = addresses[acc];
    const isAddress = await this.web3.utils.isAddress(address);
    const isTokenAddress = await this.web3.utils.isAddress(tokenAddress);
    if (isAddress && isTokenAddress) {
      const tokensContract = new this.web3.eth.Contract(tokensABI, tokenAddress);
      return await tokensContract.methods.balanceOf(address).call({});
    }
  }
}

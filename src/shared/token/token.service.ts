import { tokensABI } from './../../abi/tokens';
import { Component } from '@nestjs/common';

const Web3 = require('web3');

@Component()
export class TokenService {
  private web3: any;
  private ethWeb3: any;

  constructor() {
    this.web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.aerumProvider));
    this.ethWeb3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ethProvider));
  }

  private async safePromise<T>(promise: Promise<T>, defaultValue: T = null) {
    try {
      return await promise;
    } catch (e) {
      return defaultValue;
    }
  }

  public async getAerNetworkTokenInfo(contractAddress: string, account: string): Promise<{address, symbol, decimals, totalSupply, balance}> {
    if (!this.web3.utils.isAddress(contractAddress)) {
      throw new Error('Address is not valid');
    }
    const tokenContract = new this.web3.eth.Contract(tokensABI, contractAddress, {from: account, gas: 4000000});
    return this.getNetworkTokenInfo(tokenContract, contractAddress, account);
  }

  public async getEthNetworkTokenInfo(contractAddress: string, account: string): Promise<{address, symbol, decimals, totalSupply, balance}> {
    if (!this.ethWeb3.utils.isAddress(contractAddress)) {
      throw new Error('Address is not valid');
    }
    const tokenContract = new this.ethWeb3.eth.Contract(tokensABI, contractAddress, {from: account, gas: 4000000});
    return this.getNetworkTokenInfo(tokenContract, contractAddress, account);
  }

  private async getNetworkTokenInfo(tokenContract: any, contractAddress: string, account: string): Promise<{address, symbol, decimals, totalSupply, balance}> {
    const tokenSymbol = tokenContract.methods.symbol().call();
    const tokenDecimals = tokenContract.methods.decimals().call();
    const tokenTotalSupply = tokenContract.methods.totalSupply().call();
    const tokenBalanceOf = tokenContract.methods.balanceOf(account).call();

    const [symbol, decimals, totalSupply, balance] = await Promise.all([
      this.safePromise(tokenSymbol, null),
      this.safePromise(tokenDecimals, 0),
      this.safePromise(tokenTotalSupply, 0),
      this.safePromise(tokenBalanceOf, 0)
    ]);

    const decimalsNumber = Number(decimals) || 0;
    const token = {
      address: contractAddress,
      symbol: symbol || null,
      decimals: decimalsNumber,
      totalSupply: Number(totalSupply) || 0,
      balance: (Number(balance) || 0) / Math.pow(10, Number(decimalsNumber))
    };
    return token;
  }

}
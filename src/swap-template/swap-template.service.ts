import { Component } from "@nestjs/common";
import { SwapTemplate, Chain } from "../swap-template/interfaces/swap-template.interface";
import { SwapTemplateContract } from './../abi/SwapTemplateContract';
const Web3 = require('web3');

@Component()
export class SwapTemplateService {
  web3: any;
  swapTemplateContract: any;

  constructor() {
    this.web3 = this.initWeb3();
    this.swapTemplateContract = new this.web3.eth.Contract(SwapTemplateContract, process.env.swapTemplateRegistryContract);
  }

  initWeb3 = () => {
    return new Web3(new Web3.providers.WebsocketProvider(process.env.aerumProvider));
  }

  async create(id: string, onchainAsset: string, onchainAccount: string, offchainAsset: string, offchainAccount: string, rate: string, chain: Chain): Promise<void> {
    const aerumAccounts = await this.web3.eth.getAccounts();
    return this.swapTemplateContract.methods.register(id,
      onchainAsset,
      onchainAccount,
      offchainAsset,
      offchainAccount,
      rate,
      chain).send({from: aerumAccounts[process.env.privateAerNodeAddressIndex]});
  }

  async findById(id: string): Promise<SwapTemplate> {
    const aerumAccounts = await this.web3.eth.getAccounts();
    try{
      const result = await this.swapTemplateContract.methods.templateById(id).call({from: aerumAccounts[process.env.privateAerNodeAddressIndex]});
      const template: SwapTemplate = {
        id: result[0],
        owner: result[1],
        onchainAsset: result[2],
        onchainAccount: result[3],
        offchainAsset: result[4],
        offchainAccount: result[5],
        rate: Number(result[6]),
        chain: result[7],
        state: ''
      }
      return template;
    }catch(err){
      console.log('template load error', err);
      throw err;
    }
  }
}
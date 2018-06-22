import { Component } from "@nestjs/common";
import { SwapTemplate, Chain } from "../swap-template/interfaces/swap-template.interface";
import { SwapTemplateRegistry } from '../abi/SwapTemplateRegistry';
import { Contract } from 'web3/types';
const Web3 = require('web3');

/**
 * Service for reading SwapTemplates from smart contract
 */
@Component()
export class SwapTemplateService {
  web3: any;
  swapTemplateContract: Contract;

  constructor() {
    this.web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.aerumProvider));
    this.swapTemplateContract = new this.web3.eth.Contract(SwapTemplateRegistry, process.env.swapTemplateRegistryContract);
  }

  /**
   * Method finds SwapTemplate by specified Id
   */
  async findById(id: string): Promise<SwapTemplate> {
    const aerumAccounts = await this.web3.eth.getAccounts();
    const account = aerumAccounts[process.env.privateAerNodeAddressIndex];
    try{
      const result = await this.swapTemplateContract.methods.templateById(id).call({from: account});
      const template: SwapTemplate = {
        id: result[0],
        owner: result[1],
        onchainAsset: result[2],
        onchainAccount: result[3],
        offchainAsset: result[4],
        offchainAccount: result[5],
        rate: Number(result[6]),
        chain: result[7],
        state: result[8]
      }
      return template;
    } catch(err) {
      console.log('template load error', err);
      throw err;
    }
  }
}
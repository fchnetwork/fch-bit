import { PublicResolver } from './../../abi/PublicResolver';

import { Component } from '@nestjs/common';
import { hash } from 'eth-ens-namehash';
import { SwapTemplate } from './../../swap-template/interfaces/swap-template.interface';

const Web3 = require('web3');

@Component()
export class AerumNameService {
  private readonly emptyAddress = '0x0000000000000000000000000000000000000000';
  private readonly web3: any;

  constructor() {
    this.web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.aerumProvider));
  }

  /**
   * Resolves aens name of each swap template member.
   * @param {SwapTemplate} nameOrAddress - aens name or address
   * @return {Promise<SwapTemplate>} - new swap template with aens resolved members
   */
  async normalizeTemplate(swapTemplate: SwapTemplate): Promise<SwapTemplate> {
    const [offchainAccount, offchainAsset, onchainAccount, onchainAsset, owner] = await Promise.all([
      this.safeResolveNameOrAddress(swapTemplate.offchainAccount),
      this.safeResolveNameOrAddress(swapTemplate.offchainAsset),
      this.safeResolveNameOrAddress(swapTemplate.onchainAccount),
      this.safeResolveNameOrAddress(swapTemplate.onchainAsset),
      this.safeResolveNameOrAddress(swapTemplate.owner)
    ]);
    return {
      id: swapTemplate.id,
      owner: owner,
      onchainAsset: onchainAsset,
      onchainAccount: onchainAccount,
      offchainAsset: offchainAsset,
      offchainAccount: offchainAccount,
      rate: swapTemplate.rate,
      state: swapTemplate.state,
      chain: swapTemplate.chain
    }
  }

  /**
   * Resolves aens name or address according to aerum name service. In case of exception returns null
   * @param {string} nameOrAddress - aens name or address
   * @return {Promise<string>} - address that corresponds to aens name
   */
  async safeResolveNameOrAddress(nameOrAddress: string): Promise<string> {
    try {
      const address = await this.resolveNameOrAddress(nameOrAddress);
      return address ? address.toLowerCase() : address;
    } catch (e) {
      console.log('aerum name service >>>>> An error occurred while resolving aens name', e);
      return '';
    }
  }

  /**
   * Resolves aens name or address according to aerum name service.
   * @param {string} nameOrAddress - aens name or address
   * @return {Promise<string>} - address that corresponds to aens name
   */
  async resolveNameOrAddress(nameOrAddress: string): Promise<string> {
    if(!nameOrAddress) {
      return '';
    }
    if(nameOrAddress.endsWith('.aer')) {
      const nameOrAddressLower = nameOrAddress.toLowerCase();
      const node = hash(nameOrAddressLower);
      const address = await this.getAddress(node);
      if(address === this.emptyAddress) {
        return '';
      }
      return address || '';
    }
    return nameOrAddress;
  }

  private async getAddress(node: string) : Promise<string> {
    const aerumAccounts = await this.web3.eth.getAccounts();
    const aerumAccount = aerumAccounts[process.env.privateAerNodeAddressIndex];
    const aensContract = new this.web3.eth.Contract(PublicResolver, process.env.AerAensPublicResolver, {from: aerumAccount, gas: 4000000});
    const addr = await aensContract.methods.addr(node).call();
    return addr;
  }
}

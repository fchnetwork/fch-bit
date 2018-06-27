import { tokensABI } from './../abi/tokens';
import { Component, Inject } from '@nestjs/common';
import { SwapStorageService } from './swap-storage.service';
import { OpenAtomicSwapEther } from '../abi/OpenAtomicSwapEther';
import { CounterAtomicSwapERC20 } from './../abi/CounterAtomicSwapERC20';
import { SwapTemplate } from './../swap-template/interfaces/swap-template.interface';
const Web3 = require('web3');
import * as Moment from 'moment';

@Component()
export class SwapService {
  web3: any;
  ethWeb3: any;
  key: any;
  hash: any;
  prefix: any;
  minutes: number;

  constructor(private readonly swapStorageService: SwapStorageService) {

    this.web3 = this.initWeb3();
    // Key and hashes are hardcoded now for tests (key should be changed everytime when reload app)
    this.key = '0x59a995655bffe188c9823a2f914641a32dcbb1b28e8586bd29af291db7dcd4e8';
    this.hash = this.web3.utils.keccak256(this.key);
    this.minutes = Number(process.env.minutes);
  }

  initWeb3 = () => {
    return new Web3( new Web3.providers.WebsocketProvider(process.env.aerumProvider));
  }

  swapEventListener(template: SwapTemplate) {
    this.ethWeb3 = new Web3( new Web3.providers.WebsocketProvider(process.env.ethProvider));
    const atomicSwapERC20Contract = new this.web3.eth.Contract(CounterAtomicSwapERC20, process.env.AerCounterAtomicSwapERC20);
    const atomicSwapEtherAddress = new this.ethWeb3.eth.Contract(OpenAtomicSwapEther, process.env.EthOpenAtomicSwapEther);
    this.listenOpen(atomicSwapEtherAddress, atomicSwapERC20Contract, template);
    this.listenExpire(atomicSwapEtherAddress, atomicSwapERC20Contract);
    this.listenClose(atomicSwapERC20Contract, atomicSwapEtherAddress);
    // this.testOpen(atomicSwapEtherAddress);
    // this.testExpire(atomicSwapEtherAddress);
    // this.testClose(atomicSwapERC20Contract );
    console.log('swap event listening');
  }

  async accountExists(withdrawTrader) {
    const accounts = await this.ethWeb3.eth.getAccounts();
    for (const i of accounts) {
      if (i === withdrawTrader) {
        return true;
      }
    }
    return false;
  }

  async listenOpen(atomicSwapEtherAddress, atomicSwapERC20Contract, template: SwapTemplate){
    const aerumAccounts = await this.web3.eth.getAccounts();
    const currentBlock = await this.ethWeb3.eth.getBlockNumber();
    console.log(">>>> open Current Block Eth "+ currentBlock)
    atomicSwapEtherAddress.events.Open({}, { fromBlock:currentBlock-1, toBlock: 'latest' }, (error, res) => {
      console.log(">>>> open block num "+ res.blockNumber)
      if (error) {
        console.log(error);
      } else if ( res.blockNumber >= currentBlock ) {
        console.log("==== Entered open event processor at block: "+res.blockNumber+" =====");
        const hash = res.returnValues._hash;
        this.swapStorageService.findById(hash).then((swapExists) => {

        // TODO:  event open on AtomicSwapEther contract has topic with hash and withdraw trader - need to check if we own address withdrawtrader before doing other checks below
        //  if (this.accountExists(res.returnValues.withdrawTrader~

        if (!swapExists) {
            console.log(">>>>> Not found record in DB for swap\n"+res);
            atomicSwapEtherAddress.methods.check(hash).call().then((checkRes) => {
              console.log('============= SwapERC20.check() =========\n', checkRes);
              // Using token address from swap template onchain asset
              const tokenAddress = template.onchainAsset;
              const minValue = process.env.minValueSwap;
              const maxValue = process.env.maxValueSwap;
              const timeLockNow = Moment(new Date());
              const presetTimelock = timeLockNow.add(this.minutes, 'm').unix();
              const timelock = checkRes.timelock;

              const presetExchangeRate = process.env.presetExchangeRateSwap;
              const tokenDigits = process.env.presetTokenDigits;
              const templateRateDecimals = 18;
              // Using rate from swap template. Also adjusting rate decimals.
              const exchangeRate = template.rate / Math.pow(10, templateRateDecimals);
              let value = checkRes.value;
              const etherDigits = 18; // for Ether to Token conversion
              const withdrawTrader = checkRes.withdrawTrader; // it should be one of our Ethereum addresses to respond to that event

              this.swapStorageService.create(hash, timelock, value, aerumAccounts[process.env.privateAerNodeAddressIndex], withdrawTrader, null);
              if (this.accountExists(withdrawTrader) && Number(value) >= Number(minValue) && Number(value) <= Number(maxValue) && Number(timelock) > Number(presetTimelock) && exchangeRate >= Number(presetExchangeRate)) {
                const tokenContract = new this.web3.eth.Contract(tokensABI, tokenAddress, {from: aerumAccounts[process.env.privateAerNodeAddressIndex], gas: 4000000});

                // TODO: >>>> if no present tokenDigits in config - pull it from the token contract before approving
                // TODO: >>>> pull the exchange rate from the templates contract by ID in .env and divide by 10**18

                value = value / Math.pow(10,etherDigits);
                value = value * Math.pow(10,tokenDigits);
                value = value * exchangeRate;
                console.log(`<<<<< the value of value is ${value}`);
                tokenContract.methods.approve(process.env.AerCounterAtomicSwapERC20, value).send({from: aerumAccounts[process.env.privateAerNodeAddressIndex], gas: 4000000}).then((approveRes) => {
                  console.log('>>> Token approve call:\n', approveRes);

                  // removed withdraw trader from erc20 open as it had false logic and removed from the contract
                  atomicSwapERC20Contract.methods.open(hash, value, tokenAddress, timelock).send({from: aerumAccounts[process.env.privateAerNodeAddressIndex], gas: 4000000}).then((erc2Res) => {
                    console.log('>>> SwapErc20 open call:\n', erc2Res);
                    // Start testing here (don't delete)
                    // this.testClose(atomicSwapERC20Contract);
                    this.swapStorageService.updateById(hash, {status: 'open'});
                  }).catch((erc2err)=>{
                    console.log('>>>>> Swap DB record update error -- erc2err\n', erc2err);
                  });
                }).catch((approveErr)=>{
                  console.log('>>>> Token approve method error -- approveErr\n', approveErr);
                });
              }
            });
          }
        });
      } else {
        console.log(">>>>received old Open Event for block:"+res.blockNumber)
      }
    });
  }

  async listenExpire(atomicSwapEtherAddress, atomicSwapERC20Contract){
    const aerumAccounts = await this.web3.eth.getAccounts();
    const currentBlock = await this.ethWeb3.eth.getBlockNumber();
    console.log("Expire Current Block Eth "+ currentBlock)
    atomicSwapEtherAddress.events.Expire({}, { fromBlock: currentBlock-1, toBlock: 'latest' }, (error, res) => {
      if (error) {
        console.log('expired error', error);
      } else if ( res.blockNumber > currentBlock ) {
        const hash = res.returnValues._hash;
        this.swapStorageService.findById(hash).then((swapExists) => {
          if (swapExists.status !== 'expired' && swapExists.status !== 'invalid') {
            console.log('expired res', res);
            atomicSwapERC20Contract.methods.expire(hash).send({from: aerumAccounts[process.env.privateAerNodeAddressIndex], gas: 4000000}).then((expireRes) => {
              console.log('erc20expire res', expireRes);
              this.swapStorageService.updateById(hash, {status: 'expired'});
            }).catch((expireErr) => {
              console.log('expireRess', expireErr);
            });
          }
        })
      } else {
        console.log("received old Expire Event")
      }
    });
  }

  async listenClose(contract, atomicSwapEtherAddress){
    const currentBlock = await this.web3.eth.getBlockNumber();
    console.log("close Current Block aerum "+ currentBlock)
    contract.events.Close({}, { fromBlock: currentBlock-1, toBlock: 'latest' }, (error, res) => {
      if (error) {
        console.log('closeErr', error);
      } else if ( res.blockNumber > currentBlock ) {
        const hash = res.returnValues._hash;
        const secretKey = res.returnValues._secretKey;
        const withdrewBy = res.returnValues._withdrawTrader; // currently not needed but just in case -- A.R.

        this.swapStorageService.updateByCondition({swapId: hash, status: 'open'}, {secretKey});
        // .then((respond) => {
        this.swapStorageService.findById(hash).then((itemRes) => {
          console.log('found item res', itemRes);
          atomicSwapEtherAddress.methods.close(hash, secretKey).send({from: itemRes.withdrawTrader, gas: 4000000}).then((methodRes) => {
            console.log('final close', methodRes);
            this.swapStorageService.updateById(hash, {status: 'closed'});
          }).catch((finalCloseErr) => {
            console.log(finalCloseErr);
          });
        });
        // });
      } else {
        console.log("received old Close Event")
      }
    });
  }

  // Testing functions
  // async testOpen(contract){
  //   const open = await contract.methods.open(this.hash, '0x070ad9b63522f50b10fa8b42e4da6ba7b10c756f', 1622883484).send({from: '0x070ad9b63522f50b10fa8b42e4da6ba7b10c756f', gas: 4000000}).then((res) => {
  //     console.log(open);
  //   }).catch((err) => {
  //     console.log(err);
  //   });
  // }

  // async testExpire(contract){
  //   const hash = '0x261c74f7dd1ed6a069e18375ab2bee9afcb1095613f53b07de11829ac66cdfc5';
  //   const expire = await contract.methods.expire(hash).send({from: '0x070ad9b63522f50b10fa8b42e4da6ba7b10c756f', gas: 4000000}).catch((err) => {
  //     console.log(err);
  //   });
  // }
  // async testClose(contract){
  //   const close = await contract.methods.close(this.hash, this.key).send({from: '0x070ad9b63522f50b10fa8b42e4da6ba7b10c756f', gas: 4000000, gasPrice: 4000000000}).then((res) => {
  //   }).catch((err) => {
  //     console.log(err);
  //   });
  // }

}

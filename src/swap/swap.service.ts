import { tokensABI } from './../abi/tokens';
import { TransferDto } from './../transactions/dto/transfer.dto';
import { UpdateSwapDto } from './dto/update-swap.dto';
import { Model } from 'mongoose';
import { Component, Inject } from '@nestjs/common';
import { Swap } from './interfaces/swap.interface';
import { RegisterSwapDto } from './dto/register-swap.dto';
import * as Moment from 'moment';
import { AccountService } from '../account/services/account.service';
import { AtomicSwapEther } from './../abi/AtomicSwapEther';
import { AtomicSwapERC20 } from './../abi/AtomicSwapERC20';
const Web3 = require('web3');

@Component()
export class SwapService {
  web3: any;
  rinkebyWeb3: any;
  key: any;
  hash: any;
  prefix: any;
  tokenAddress: any;
  minutes: number;
  
  constructor(
    @Inject('SwapModelToken') private readonly swapModel: Model<Swap>,
    private accountService: AccountService,
  ) {
    this.web3 = this.initWeb3();
    // Key and hashes are hardcoded now for tests (key should be changed everytime when reload app)
    this.key = '0x59a995655bffe188c9823a2f914641a32dcbb1b28e8586bd29af291db7dcd4e8';
    this.hash = this.web3.utils.keccak256(this.key);
    // RINK hardcoded token address
    this.tokenAddress = process.env.contractAddress;
    this.minutes = Number(process.env.minutes);
  }

  initWeb3 = () => {
    return new Web3( new Web3.providers.WebsocketProvider(process.env.httpProvider));
  }

  async create(swapId, timelock, value, ethTrader, withdrawTrader, secretKey): Promise<Swap> {
    const registerSwapData: RegisterSwapDto = {
      swapId,
      timelock,
      value,
      ethTrader,
      withdrawTrader,
      secretKey,
      status: 'pending',
    };
    const registeredSwap = new this.swapModel(registerSwapData);
    return await registeredSwap.save();
  }

  async findAll(): Promise<Swap[]> {
    return await this.swapModel.find().exec();
  }

  async findById(id): Promise<Swap> {
    return await this.swapModel.findOne({swapId: id}).exec();
  }

  async update(swapId, secretKey, status): Promise<any> {
    return new Promise((resolve, reject) => {
      const updatedTransaction = this.swapModel.findOneAndUpdate({swapId}, {$set: {secretKey, status}})
        .then((res) => {
          this.swapModel.findOne({swapId}).then((itemRes) => {
            resolve(itemRes);
          });
        });
    });

  }

  swapEventListener() {
    this.rinkebyWeb3 = new Web3( new Web3.providers.WebsocketProvider(process.env.rinkebyProvider));
    const atomicSwapERC20Contract = new this.web3.eth.Contract(AtomicSwapERC20, process.env.AtomicSwapERC20);
    const atomicSwapEtherAddress = new this.rinkebyWeb3.eth.Contract(AtomicSwapEther, process.env.AtomicSwapEtherAddress);

    this.listenOpen(atomicSwapEtherAddress, atomicSwapERC20Contract);
    this.listenExpire(atomicSwapEtherAddress, atomicSwapERC20Contract);
    this.listenClose(atomicSwapERC20Contract, atomicSwapEtherAddress);

    // this.testOpen(atomicSwapEtherAddress);
    // this.testExpire(atomicSwapEtherAddress);
    // this.testClose(atomicSwapERC20Contract );
    console.log('swap event listening');
  }

  async accountExists(withdrawTrader) {
    const accounts = await this.rinkebyWeb3.eth.getAccounts();
    for (const i of accounts) {
      if (i === withdrawTrader) {
        return true;
      }
    }
    return false;
  }

  async listenOpen(atomicSwapEtherAddress, atomicSwapERC20Contract){
    const aerumAccounts = await this.web3.eth.getAccounts();

    atomicSwapEtherAddress.events.Open({}, { fromBlock: 0, toBlock: 'latest' }, (error, res) => {
      if (error) {
        console.log(error);
      } else {
        const hash = res.returnValues._hash;
        this.swapModel.findOne({swapId: hash}).then((swapExists) => {
          if (!swapExists) {
            console.log(res);
            atomicSwapEtherAddress.methods.check(hash).call().then((checkRes) => {
              console.log('checkRes', checkRes);
              const minValue = 0;
              const maxValue = 100000000000000000000000000;
              const timeLockNow = Moment(new Date());
              const presetTimelock = timeLockNow.add(this.minutes, 'm').unix();
              const timelock = checkRes.timelock;
              const presetExchangeRate = 0.1;
              const exchangeRate = 0.2;
              const value = checkRes.value;
              const withdrawTrader = checkRes.withdrawTrader;

              this.create(hash, timelock, value, aerumAccounts[1], withdrawTrader, null);
              if (this.accountExists(withdrawTrader) && Number(value) >= Number(minValue) && Number(value) <= Number(maxValue) && Number(timelock) > Number(presetTimelock) && Number(exchangeRate) >= Number(presetExchangeRate)) {
                const tokenContract = new this.web3.eth.Contract(tokensABI, this.tokenAddress, {from: aerumAccounts[1], gas: 4000000});
                tokenContract.methods.approve(process.env.AtomicSwapERC20, value).send({from: aerumAccounts[1], gas: 4000000}).then((approveRes) => {
                  console.log('approve works', approveRes);
                  atomicSwapERC20Contract.methods.open(hash, value, this.tokenAddress, aerumAccounts[1], timelock).send({from: aerumAccounts[1], gas: 4000000}).then((erc2Res) => {
                    console.log('erc20 open', erc2Res);

                    // Start testing here (don't delete)
                    // this.testClose(atomicSwapERC20Contract);
                    this.swapModel.findOneAndUpdate({swapId: hash}, {$set: {status: 'open'}}, {new: true}).exec();
                  }).catch((erc2err)=>{
                    console.log('erc2err', erc2err);
                  });
                }).catch((approveErr)=>{
                  console.log('approveErr', approveErr);
                });
              }
            });
          }
        });

      }
    });
  }

  async listenExpire(atomicSwapEtherAddress, atomicSwapERC20Contract){
    const aerumAccounts = await this.web3.eth.getAccounts();

    atomicSwapEtherAddress.events.Expire({}, { fromBlock: 452301, toBlock: 'latest' }, (error, res) => {
      if (error) {
        console.log('expired error', error);
      } else {
        const hash = res.returnValues._hash;
        this.swapModel.findOne({swapId: hash}).then((swapExists) => {
          if (swapExists.status !== 'expired' && swapExists.status !== 'invalid') {
            console.log('expired res', res);
            atomicSwapERC20Contract.methods.expire(hash).send({from: aerumAccounts[1], gas: 4000000}).then((expireRes) => {
              console.log('erc20expire res', expireRes);
              this.swapModel.findOneAndUpdate({swapId: hash}, {$set: {status: 'expired'}}, {new: true}).exec();
            }).catch((expireErr) => {
              console.log('expireRess', expireErr);
            });
          }
        })
      }
    });
  }

  listenClose(contract, atomicSwapEtherAddress){
    contract.events.Close({}, { fromBlock: 452301, toBlock: 'latest' }, (error, res) => {
      if (error) {
        console.log('closeErr', error);
      } else {
        console.log('closeEventRed', res);
        const hash = res.returnValues._hash;
        const secretKey = res.returnValues._secretKey;

        this.swapModel.findOneAndUpdate({swapId: hash, status: 'open'}, {$set: {secretKey}}).exec();
        // .then((respond) => {
        this.swapModel.findOne({swapId: hash}).then((itemRes) => {
          console.log('found item res', itemRes);
          atomicSwapEtherAddress.methods.close(hash, secretKey).send({from: itemRes.withdrawTrader, gas: 4000000}).then((methodRes) => {
            console.log('final close', methodRes);
            this.swapModel.findOneAndUpdate({swapId: hash}, {$set: {status: 'closed'}}, {new: true}).exec();
          }).catch((finalCloseErr) => {
            console.log(finalCloseErr);
          });
        });
        // });
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

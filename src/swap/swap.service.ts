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
  constructor(
    @Inject('SwapModelToken') private readonly swapModel: Model<Swap>,
    private accountService: AccountService,
  ) {
    this.web3 = this.initWeb3();
    // Key and hashes are hardcoded now for tests (key should be changed everytime when reload app)
    this.key = '0x49a995655bffe188c9823a2f914641a32dcbb1b28e8586bd29af291db7dcd4e8';
    this.hash = this.web3.utils.keccak256(this.key);
    this.tokenAddress = '0x3b693bd00d9e9faecfef96efbee223817117bddd';
  }

  initWeb3 = () => {
    return new Web3( new Web3.providers.WebsocketProvider(process.env.aerumProvider));
  }

  async create(data): Promise<Swap> {
    const registerSwapData: RegisterSwapDto = {
      swapId: data.swapId,
      timelock: data.timelock,
      value: data.value,
      ethTrader: data.ethTrader,
      withdrawTrader: data.withdrawTrader,
      secretKey: data.secretKey,
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
      const updatedTransaction = this.swapModel.findOneAndUpdate({swapId}, {secretKey, status})
        .then((res) => {
          this.swapModel.findOne({swapId}).then((itemRes) => {
            resolve(itemRes);
          });
        });
    });

  }

  swapEventListener() {
    this.rinkebyWeb3 = new Web3( new Web3.providers.WebsocketProvider(process.env.rinkebyProvider));
    const atomicSwapERC20Contract = new this.rinkebyWeb3.eth.Contract(AtomicSwapERC20, process.env.AtomicSwapERC20);
    const atomicSwapEtherAddress = new this.rinkebyWeb3.eth.Contract(AtomicSwapEther, process.env.AtomicSwapEtherAddress);

    this.listenOpen(atomicSwapEtherAddress, atomicSwapERC20Contract);
    this.listenExpire(atomicSwapEtherAddress);
    this.listenClose(atomicSwapERC20Contract, atomicSwapEtherAddress);

    // this.testOpen(atomicSwapEtherAddress);
    // this.testExpire(atomicSwapEtherAddress);
    // this.testClose(atomicSwapERC20Contract );
    console.log('swap event listening');
  }

  async accountExists(withdrawTrader) {
    const accounts = await this.web3.eth.getAccounts();
    for (const i of accounts) {
      if (i === withdrawTrader) {
        return true;
      }
    }
    return false;
  }

  listenOpen(atomicSwapEtherAddress, atomicSwapERC20Contract){

    atomicSwapEtherAddress.events.Open({}, { fromBlock: 0, toBlock: 'latest' }, (error, res) => {
      if (error) {
        console.log(error);
      } else {
        const hash = res.returnValues._hash;
        atomicSwapEtherAddress.methods.check(hash).call().then((checkRes) => {
          const minValue = 0;
          const maxValue = 10;
          const presetTimelock = 1622883484;
          const timelock = checkRes.timelock;
          const presetExchangeRate = 0.1;
          const exchangeRate = 0.2;
          const value = 0.1;
          const withdrawTrader = checkRes.withdrawTrader;

          if (this.accountExists(withdrawTrader) && Number(value) >= Number(minValue) && Number(value) <= Number(maxValue) && String(timelock) === String(presetTimelock) && Number(exchangeRate) >= Number(presetExchangeRate)) {
            const tokenContract = new this.web3.eth.Contract(tokensABI, this.tokenAddress, {from: checkRes.withdrawTrader, gas: 4000000});
            tokenContract.methods.approve(withdrawTrader, value).send({from: checkRes.withdrawTrader, gas: 4000000}).then((approveRes) => {
              atomicSwapERC20Contract.methods.open(hash, value, this.tokenAddress, withdrawTrader, timelock).send({from: checkRes.withdrawTrader, gas: 4000000}).then((erc2Res) => {
                // Start testing here (don't delete)
                // this.testClose(atomicSwapERC20Contract);
              });
            });
          }
        });
      }
    });
  }

  listenExpire(contract){
    contract.events.Expire({}, { fromBlock: 0, toBlock: 'latest' }, (error, res) => {
      if (error) {
        console.log(error);
      } else {
        const hash = res.returnValues._hash;
        this.swapModel.findOneAndUpdate({swapId: hash, status: 'open'}, {status: 'expired'})
        .then((respond) => {
          this.swapModel.findOne({swapId: hash});
        });
      }
    });
  }

  listenClose(contract, atomicSwapEtherAddress){
    contract.events.Close({}, { fromBlock: 0, toBlock: 'latest' }, (error, res) => {
      if (error) {
        console.log(error);
      } else {
        const hash = res.returnValues._hash;
        const secretKey = res.returnValues._secretKey;

        this.swapModel.findOneAndUpdate({swapId: hash, status: 'open'}, {secretKey})
        .then((respond) => {
          this.swapModel.findOne({swapId: hash}).then((itemRes) => {
            atomicSwapEtherAddress.methods.close(hash, secretKey).send({from: itemRes.withdrawTrader, gas: 4000000}).then((methodRes) => {
              this.swapModel.findOneAndUpdate({swapId: hash, status: 'open'}, {status: 'closed'});
            });
          });
        });
      }
    });
  }

  // Testing functions
  // async testOpen(contract){
  //   const open = await contract.methods.open(this.hash, '0x131ae1a0c00c4d9f886fe0d1fc951ffb2c83cb1f', 1622883484).send({from: '0x131ae1a0c00c4d9f886fe0d1fc951ffb2c83cb1f', gas: 4000000}).then((res) => {
  //   }).catch((err) => {
  //     console.log(err);
  //   });
  // }

  // async testExpire(contract){
  //   const hash = '0x261c74f7dd1ed6a069e18375ab2bee9afcb1095613f53b07de11829ac66cdfc5';
  //   const expire = await contract.methods.expire(hash).send({from: '0x131ae1a0c00c4d9f886fe0d1fc951ffb2c83cb1f', gas: 4000000}).catch((err) => {
  //     console.log(err);
  //   });
  // }
  // async testClose(contract){
  //   const close = await contract.methods.close(this.hash, this.key).send({from: '0x131ae1a0c00c4d9f886fe0d1fc951ffb2c83cb1f', gas: 4000000, gasPrice: 4000000000}).then((res) => {
  //   }).catch((err) => {
  //     console.log(err);
  //   });
  // }

}

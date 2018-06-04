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
  constructor(
    @Inject('SwapModelToken') private readonly swapModel: Model<Swap>,
    private accountService: AccountService,
  ) {
    this.web3 = this.initWeb3();
  }

  initWeb3 = () => {
    return new Web3( new Web3.providers.WebsocketProvider(process.env.httpProvider));
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
    // body.swapId, body.timelock, body.value, body.ethTrader, body.withdrawTrader, body.seckretKey
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
    // atomicSwapEtherAddress.events.allEvents({}, { fromBlock: 0, toBlock: 'latest' }, (error, res) => {
    //   if (error) {
    //     console.log(error);
    //   } else {
    //     console.log(res);
    //   }
    // });
    // atomicSwapERC20Contract.events.allEvents({}, { fromBlock: 0, toBlock: 'latest' }, (error, res) => {
    //   if (error) {
    //     console.log(error);
    //   } else {
    //     console.log(res);
    //   }
    // });
    // console.log(atomicSwapEtherAddress);
    this.listenOpen(atomicSwapEtherAddress, atomicSwapERC20Contract);
    // this.listenExpire(atomicSwapEtherAddress);
    this.listenClose(atomicSwapERC20Contract, atomicSwapEtherAddress);
    
    this.testOpen(atomicSwapEtherAddress);
    // this.testExpire(atomicSwapEtherAddress);
    // this.testClose(atomicSwapERC20Contract );
    console.log('swap event listening');
  }

  listenOpen(atomicSwapEtherAddress, atomicSwapERC20Contract){
    atomicSwapEtherAddress.events.Open({}, { fromBlock: 0, toBlock: 'latest' }, (error, res) => {
      if (error) {
        console.log(error);
      } else {
        console.log('opened in event');
        // console.log(res);
        const hash = res.returnValues._hash;
        atomicSwapEtherAddress.methods.check(hash).call().then((checkRes) => {
          console.log('checkRes');
          // console.log(checkRes);
          const minValue = 0;
          const maxValue = 10;
          const presetTimelock = 11;
          const timelock = checkRes.timelock;
          const presetExchangeRate = 0.1;
          const exchangeRate = 0.2;
          const value = checkRes.value;
          const withdrawTrader = checkRes.withdrawTrader;
          // console.log(Number(value));
          // console.log(Number(minValue));
          // console.log(Number(maxValue));
          // console.log(String(timelock));
          // console.log(String(presetTimelock));
          if (Number(value) >= Number(minValue) && Number(value) <= Number(maxValue) && String(timelock) === String(presetTimelock) && Number(exchangeRate) >= Number(presetExchangeRate)) {
            console.log('start open in erc20 res');
            console.log(atomicSwapERC20Contract.methods);
            // TODO: redeploy Radek token
            const tokenContract = new this.web3.eth.Contract(tokensABI, '0x8dc2df9d07dabb444ed78de93542cd5d6355b403', {from: '0x131ae1a0c00c4d9f886fe0d1fc951ffb2c83cb1f', gas: 4000000});
            tokenContract.approve(withdrawTrader, value).send({from: '0x131ae1a0c00c4d9f886fe0d1fc951ffb2c83cb1f', gas: 4000000}).then((approveRes)=>{
              atomicSwapERC20Contract.methods.open(hash, value, 'token contract address', withdrawTrader, timelock).send({from: '0x131ae1a0c00c4d9f886fe0d1fc951ffb2c83cb1f', gas: 4000000}).then((erc2Res) => {
                console.log('erc20Res');
                console.log(erc2Res);
                // this.update(hash, null, 'open');
              });
            });
          }
        })

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
          this.swapModel.findOne({swapId: hash}).then((itemRes) => {
            console.log(respond);
          });
        });
      }
    });
  }

  listenClose(contract, atomicSwapEtherAddress){
    contract.events.Close({}, { fromBlock: 0, toBlock: 'latest' }, (error, res) => {
      if (error) {
        console.log(error);
      } else {
        console.log(res);
        // const hash = res.hash;
        // const secretKey = res.secretKey;
        // atomicSwapEtherAddress.close(hash, secretKey).then((methodRes) => {
        //   console.log(methodRes);
        //     // this.swapModel.findOneAndUpdate({swapId: hash, status: 'open'}, {status: 'closed'});
        // });
        // this.swapModel.findOneAndUpdate({swapId: hash, status: 'open'}, {secretKey})
        // .then((respond) => {
        //   this.swapModel.findOne({swapId: hash}).then((itemRes) => {
        //     console.log(respond);
        //     atomicSwapEtherAddress.close(hash, secretKey).then((methodRes) => {
        //       this.swapModel.findOneAndUpdate({swapId: hash, status: 'open'}, {status: 'closed'});
        //     });
        //   });
        // });
      }
    });
  }

  async testOpen(contract){
    const hash = '0x361c74f7dd1ed6a069e18375ab2bee9afcb1095613f53b07de11829ac66cdfc5';
    const open = await contract.methods.open(hash, '0x131ae1a0c00c4d9f886fe0d1fc951ffb2c83cb1f', 11).send({from: '0x131ae1a0c00c4d9f886fe0d1fc951ffb2c83cb1f', gas: 4000000}).then((res) => {
      // console.log(res);
    }).catch((err) => {
      console.log(err);
    });
  }

  // async testExpire(contract){
  //   const hash = '0x261c74f7dd1ed6a069e18375ab2bee9afcb1095613f53b07de11829ac66cdfc5';
  //   const expire = await contract.methods.expire(hash).send({from: '0x131ae1a0c00c4d9f886fe0d1fc951ffb2c83cb1f', gas: 4000000}).catch((err) => {
  //     console.log(err);
  //   });
  // }
  async testClose(contract){
    const hash = '0x161c74f7dd1ed6a069e18375ab2bee9afcb1095613f53b07de11829ac66cdfc5';
    const key = '0x42a990655bffe188c9823a2f914641a32dcbb1b28e8586bd29af291db7dcd4e9';
    console.log(contract.methods);
    const close = await contract.methods.close(hash, key).send({from: '0x131ae1a0c00c4d9f886fe0d1fc951ffb2c83cb1f', gas: 4000000}).catch((err) => {
      console.log(err);
    });
  }


}

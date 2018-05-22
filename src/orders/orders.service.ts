import { tokensABI } from './../abi/tokens';
import { TransferDto } from './../transactions/dto/transfer.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Model } from 'mongoose';
import { Component, Inject } from '@nestjs/common';
import { Order } from './interfaces/order.interface';
import { RegisterOrderDto } from './dto/register-order.dto';
import * as Moment from 'moment';
const Web3 = require('web3');

@Component()
export class OrdersService {
  web3: any;

  constructor(@Inject('OrderModelToken') private readonly orderModel: Model<Order>) {
    this.web3 = this.initWeb3();
  }

  initWeb3 = () => {
    return new Web3( new Web3.providers.WebsocketProvider(process.env.httpProvider));
  }

  async create(data): Promise<Order> {
    const registerOrderData: RegisterOrderDto = {
      type: data.type,
      assetId: data.assetId,
      timestamp: Moment(new Date()).unix(),
      accountIndex: data.accountKey,
      customerAddress: data.receiverAddress || '',
      amount: data.amount,
      tokenANS: data.tokenANS || '',
      contractAddress: data.contractAddress || 'aero payment',
      transaction: {
        id: '',
        status: 'Pending',
        logs: [],
        receipt: {},
      },
    };
    const registeredOrder = new this.orderModel(registerOrderData);
    // TODO: implement logic when connect with node
    return await registeredOrder.save();
  }

  async findAll(): Promise<Order[]> {
    return await this.orderModel.find().exec();
  }

  async findById(id): Promise<Order> {
    return await this.orderModel.findById(id).exec();
  }

  async verifyAndUpdate(order, transaction, from, to){
    return new Promise((resolve, reject) => {
      let status;
      if ((order.type === 'aero payment' || order.type === 'token payment') && transaction.from.toLowerCase() === from.toLowerCase() && transaction.to.toLowerCase() === to.toLowerCase() && String(transaction.value) === String(order.amount)) {
        status = 'success';
      } else {
        status = 'failed data verification';
      }
      const updatedTransaction = this.orderModel.findOneAndUpdate({_id: order._id}, {transaction: {id: transaction.txHash, status}}, (err, doc) => {
        resolve(doc);
      });
    });
  }

  async update(orderId: any, txHash, from, to): Promise<any> {
    return new Promise((resolve, reject) => {
      this.web3.eth.getTransactionReceipt(txHash, (transactionErr, transaction) => {
        if (transactionErr) {
          reject(transactionErr);
        } else {
          this.orderModel.findOne({_id: orderId}, (orderErr, order) => {
            if (orderErr) {
              reject(orderErr);
            } else {
              if (order.type === 'token payment') {
                const tokensContract = new this.web3.eth.Contract(tokensABI, order.contractAddress, { from: order.customerAddress, gas: 4000000});
                tokensContract.events.Transfer({}, { fromBlock: transaction.blockNumber, toBlock: 'latest' }, (contractEventsErr, eventsRes) => {
                  if (contractEventsErr) {
                    reject(contractEventsErr);
                  } else {
                    if (eventsRes.blockNumber === transaction.blockNumber) {
                      transaction.from = eventsRes.returnValues._from;
                      transaction.to = eventsRes.returnValues._to;
                      transaction.value = eventsRes.returnValues._value;
                      this.verifyAndUpdate(order, transaction, from, to).then((verified) => {
                        resolve(verified);
                      });
                    }
                  }
                });
              }
              this.verifyAndUpdate(order, transaction, from, to).then((verified) => {
                resolve(verified);
              });
            }
          });
        }
      });
    });

  }
}

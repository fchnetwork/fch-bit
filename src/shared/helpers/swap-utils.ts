import * as Moment from 'moment';
const Web3 = require('web3');

export async function registrationBodyTemplate(currentBlock, error, res, handler) {
  if(error) {
    console.log(error);
  } else if(res.blockNumber >= currentBlock) {
    try {
      await handler();
    } catch (err) {
      console.log('swap registration >>>> ERROR in event handler', error);
    }
  } else {
      console.log('swap registration >>>> received old event for block', res.blockNumber)
  }
}

async function ethAccountExists(withdrawTrader): Promise<boolean> {
  const ethWeb3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ethProvider));
  return (await ethWeb3.eth.getAccounts()).some(account => account === withdrawTrader);
}

export function calcEthAmount(value: number, tokenDecimals: number, exchangeRate: number): number {
  value = value / Math.pow(10, tokenDecimals);
  value = value * exchangeRate;
  const result = Web3.utils.toWei(value.toString(), 'ether');
  return result;
}

export function calcTokenAmount(value: number, tokenDecimals: number, destTokenDecimals: number, exchangeRate: number): number {
  value = value / Math.pow(10, tokenDecimals);
  value = value * exchangeRate;
  const result = value * Math.pow(10, destTokenDecimals);
  return result;
}

async function aerAccountExists(withdrawTrader): Promise<boolean> {
  const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.aerumProvider));
  return (await web3.eth.getAccounts()).some(account => account === withdrawTrader);
}

export async function validateEthAccountSwap(withdrawTrader: string, value: number, timelock: number, exchangeRate: number) : Promise<boolean> {
  const minutes = Number(process.env.minutes);
  const minValue = Number(process.env.minValueSwap);
  const maxValue = Number(process.env.maxValueSwap);
  const presettimeLock = Moment(new Date()).add(minutes, 'm').unix();
  return (await ethAccountExists(withdrawTrader)) && value >= minValue && value <= maxValue && timelock > presettimeLock && exchangeRate > 0;
}

export async function validateAerAccountSwap(withdrawTrader: string, value: number, timelock: number, exchangeRate: number) : Promise<boolean> {
  const minutes = Number(process.env.minutes);
  const minValue = Number(process.env.minValueSwap);
  const maxValue = Number(process.env.maxValueSwap);
  const presettimeLock = Moment(new Date()).add(minutes, 'm').unix();
  return (await aerAccountExists(withdrawTrader)) && value >= minValue && value <= maxValue && timelock > presettimeLock && exchangeRate > 0;
}
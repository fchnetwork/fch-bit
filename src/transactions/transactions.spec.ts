import { TransactionsController } from './transactions.controller';
import { Model } from 'mongoose';
import { TransactionsService } from './services/transactions.service';
import { TransferEthDto } from './dto/transfer-eth.dto';
const Web3 = require('web3');

describe('Transactions', () => {
  let transactionsController: TransactionsController;
  let transactionsService: TransactionsService;

  beforeEach(() => {
    transactionsService = new TransactionsService(Web3);
    transactionsController = new TransactionsController(transactionsService);
  });

  describe('transfer aero', () => {
    it('should call transfer in transactions service with correct object', async () => {
      const transferObject = {
        accountKey: 1,
        amount: '0.1',
        receiverAddress: 'address',
      };
      const result = 'ok';
      jest.spyOn(transactionsService, 'transfer').mockImplementation(() => result);
      expect(await transactionsController.transfer(transferObject)).toBe(result);
      expect(transactionsService.transfer).toBeCalledWith(transferObject);
    });
  });

  describe('transfer tokens', () => {
    it('should call transfer tokens in transactions service with correct object', async () => {
      const transferObject = {
        accountKey: 1,
        amount: '0.1',
        receiverAddress: 'address',
        contractAddress: 'address',
      };
      const result = 'ok';
      jest.spyOn(transactionsService, 'transferTokens').mockImplementation(() => result);
      expect(await transactionsController.transferTokens(transferObject)).toBe(result);
      expect(transactionsService.transferTokens).toBeCalledWith(transferObject);
    });
  });

  // TODO: add unit tests for fail transaction, prepare transaction and virtual transaction

});
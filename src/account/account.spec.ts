import { AccountController } from './account.controller';
import { AccountService } from './services/account.service';

describe('Account', () => {
  let accountController: AccountController;
  let accountService: AccountService;

  beforeEach(() => {
    accountService = new AccountService();
    accountController = new AccountController(accountService);
  });

  describe('getAddresses', () => {
    it('should return an array of addresses', async () => {
      const result = ['address'];
      jest.spyOn(accountService, 'getAddresses').mockImplementation(() => result);
      expect(await accountController.getAddresses()).toBe(result);
      expect(accountService.getAddresses).toBeCalled();
    });
  });

  describe('getBalance', () => {
    it('should return a balance', async () => {
      const acc = {
        id: '0x0',
      };
      const result = 0;
      jest.spyOn(accountService, 'getBalance').mockImplementation(() => result);
      expect(await accountController.getBalance(acc)).toBe(result);
      expect(accountService.getBalance).toBeCalledWith(acc.id);
    });
  });

  describe('getTokenBalance', () => {
    it('should return a balance of token', async () => {
      const acc = {
        id: '0x0',
        address: '0x0',
      };
      const result = 0;
      jest.spyOn(accountService, 'getTokenBalance').mockImplementation(() => result);
      expect(await accountController.getTokenBalance(acc)).toBe(result);
      expect(accountService.getTokenBalance).toBeCalledWith(acc.id, acc.address);
    });
  });
});
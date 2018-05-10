import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let ordersController: OrdersController;
  let ordersService: OrdersService;

  beforeEach(() => {
    ordersService = new OrdersService();
    ordersController = new OrdersController(ordersService);
  });

  describe('findAll', () => {
    it('should return an array of orders', async () => {
      const result = ['test'];
      jest.spyOn(ordersService, 'findAll').mockImplementation(() => result);
      expect(await ordersController.findAll()).toBe(result);
      expect(ordersService.findAll).toBeCalledWith();
    });
  });

  describe('findById', () => {
    it('should return one object', async () => {
      const result = {name: 'test'};
      const params = {id: 1};
      jest.spyOn(ordersService, 'findById').mockImplementation(() => result);
      expect(await ordersController.findById(params)).toBe(result);
      expect(ordersService.findById).toBeCalledWith(params.id);
    });
  });

  describe('createOrder', () => {
    it('should return one object', async () => {
      const order = {amount: 0.1, assetId: '1ss1xd1', orderId: '1ss1xd1'};
      const result = {status: 'OK', paymentId: undefined};
      jest.spyOn(ordersService, 'create').mockImplementation(() => result);
      expect(await ordersController.create(order)).toEqual(result);
      expect(ordersService.create).toBeCalledWith(order);
    });
  });
});
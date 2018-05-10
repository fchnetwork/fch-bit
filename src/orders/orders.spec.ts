import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Model } from 'mongoose';

describe('Orders', () => {
  let ordersController: OrdersController;
  let ordersService: OrdersService;

  beforeEach(() => {
    ordersService = new OrdersService(Model);
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

  describe('updateOrder', () => {
    it('should update order, call function and return one object with status', async () => {
      const order = {
        _id: '5af43f127da0013d5334269f',
        orderId: 'new Id65',
      };
      const result = {status: 'Ok'};
      jest.spyOn(ordersService, 'update').mockImplementation(() => result);
      expect(await ordersController.update(order)).toEqual(result);
      expect(ordersService.update).toBeCalledWith(order);
    });
  });
});
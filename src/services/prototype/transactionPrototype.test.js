import { jest } from '@jest/globals';

const paymentMethodAdapter = jest.fn(() => 'pix');

jest.unstable_mockModule('./paymenthMethodAdapter.js', () => ({
  paymentMethodAdapter,
}));

const { transactionPrototype } = await import('./transactionPrototype.js');

describe('transactionPrototype', () => {
  beforeEach(() => {
    paymentMethodAdapter.mockClear();
  });

  test('fills deprecated fields and defaults', () => {
    const result = transactionPrototype({
      transactionSource: 'manual',
      totalValue: '10,00',
      itemName: 'Item A',
      itemDescription: 'Item desc',
      transactionType: 'credit',
    });

    expect(result.transactionValue).toBe('10,00');
    expect(result.transactionName).toBe('Item A');
    expect(result.transactionDescription).toBe('Item desc');
    expect(result.transactionFiscalNote).toBe('');
    expect(result.transactionLocation).toBe('other');
    expect(result.paymentMethod).toBe('pix');
    expect(paymentMethodAdapter).toHaveBeenCalledTimes(1);
  });

  test('respects explicit fields without calling adapter', () => {
    const result = transactionPrototype({
      transactionValue: '25,00',
      transactionName: 'Lunch',
      transactionDescription: 'Meal',
      transactionLocation: 'online',
      paymentMethod: 'money',
    });

    expect(result.transactionValue).toBe('25,00');
    expect(result.transactionName).toBe('Lunch');
    expect(result.transactionDescription).toBe('Meal');
    expect(result.transactionLocation).toBe('online');
    expect(result.paymentMethod).toBe('money');
    expect(paymentMethodAdapter).not.toHaveBeenCalled();
  });
});

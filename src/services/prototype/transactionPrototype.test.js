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
    expect(result.paymentMethod).toBe('money');
    expect(paymentMethodAdapter).not.toHaveBeenCalled();
  });

  test('handles freightValue and normalizes it', () => {
    const result = transactionPrototype({
      transactionValue: '100,00',
      freightValue: '15,50',
    });

    expect(result.transactionValue).toBe('100,00');
    expect(result.freightValue).toBe('15,50');
  });

  test('handles missing transactionValue and totalValue (undefined values)', () => {
    const result = transactionPrototype({
      transactionName: 'Free Item',
    });

    expect(result.transactionValue).toBeUndefined();
    expect(result.freightValue).toBeUndefined();
  });
});

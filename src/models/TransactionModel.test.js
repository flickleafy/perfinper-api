import { jest } from '@jest/globals';

jest.unstable_mockModule('../services/prototype/paymenthMethodAdapter.js', () => ({
  paymentMethodAdapter: jest.fn(() => 'pix'),
}));

const { default: TransactionModel } = await import('./TransactionModel.js');
const { paymentMethodAdapter } = await import(
  '../services/prototype/paymenthMethodAdapter.js'
);

describe('TransactionModel', () => {
  test('toJSON transform fills defaults, adapts paymentMethod, and cleans fields', () => {
    const doc = new TransactionModel({
      transactionDate: new Date('2024-01-01T00:00:00.000Z'),
      transactionSource: 'manual',
      transactionType: 'credit',
    });
    doc.set('totalValue', '123.45', { strict: false });
    doc.set('itemDescription', 'Item desc', { strict: false });
    doc.set('itemName', 'Item name', { strict: false });
    doc.set('__v', 4);

    const json = doc.toJSON();

    expect(json.id.toString()).toBe(doc._id.toString());
    expect(json._id).toBeUndefined();
    expect(json.__v).toBeUndefined();
    expect(json.transactionValue).toBe('123.45');
    expect(json.transactionDescription).toBe('Item desc');
    expect(json.transactionName).toBe('Item name');
    expect(json.paymentMethod).toBe('pix');
    expect(json.transactionLocation).toBe('other');
    expect(paymentMethodAdapter).toHaveBeenCalledTimes(1);
  });
});

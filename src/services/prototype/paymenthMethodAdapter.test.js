import { paymentMethodAdapter } from './paymenthMethodAdapter.js';

describe('paymentMethodAdapter', () => {
  test('returns existing paymentMethod', () => {
    const result = paymentMethodAdapter({
      paymentMethod: 'debit card',
      transactionSource: 'nubank',
      transactionDescription: 'pix transfer',
    });

    expect(result).toBe('debit card');
  });

  test('infers boleto from description', () => {
    const result = paymentMethodAdapter({
      transactionDescription: 'Pagamento de Boleto',
      transactionSource: 'manual',
    });

    expect(result).toBe('boleto');
  });

  test('infers pix from item description', () => {
    const result = paymentMethodAdapter({
      itemDescription: 'Pago via Pix',
      transactionSource: 'manual',
    });

    expect(result).toBe('pix');
  });

  test('falls back to source mapping', () => {
    const result = paymentMethodAdapter({
      transactionDescription: 'unknown',
      transactionSource: 'nubank-credit',
    });

    expect(result).toBe('credit card');
  });

  test('returns undefined for unmapped sources', () => {
    const result = paymentMethodAdapter({
      transactionSource: 'unknown-source',
    });

    expect(result).toBeUndefined();
  });
});

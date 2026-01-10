import validators, {
  isValidCNPJ,
  isValidCPF,
  identifyDocumentType,
  formatCNPJ,
  formatCPF,
} from './index.js';

describe('document validators', () => {
  const computeCnpjCheckDigits = (base) => {
    let sum = 0;
    let weight = 2;
    for (let i = 11; i >= 0; i--) {
      sum += Number(base.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    let remainder = sum % 11;
    const first = remainder < 2 ? 0 : 11 - remainder;
    sum = 0;
    weight = 2;
    const withFirst = `${base}${first}`;
    for (let i = 12; i >= 0; i--) {
      sum += Number(withFirst.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    remainder = sum % 11;
    const second = remainder < 2 ? 0 : 11 - remainder;
    return `${first}${second}`;
  };

  const findCnpj = (predicate) => {
    for (let i = 1; i < 10000; i++) {
      const base = String(i).padStart(12, '0');
      if (/^(\d)\1{11}$/.test(base)) {
        continue;
      }
      const digits = computeCnpjCheckDigits(base);
      const first = Number(digits[0]);
      const second = Number(digits[1]);
      if (predicate({ first, second })) {
        return `${base}${digits}`;
      }
    }
    throw new Error('Unable to generate CNPJ for test');
  };

  const computeCpfCheckDigits = (base) => {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += Number(base.charAt(i)) * (10 - i);
    }
    let remainder = sum % 11;
    const first = remainder < 2 ? 0 : 11 - remainder;
    sum = 0;
    const withFirst = `${base}${first}`;
    for (let i = 0; i < 10; i++) {
      sum += Number(withFirst.charAt(i)) * (11 - i);
    }
    remainder = sum % 11;
    const second = remainder < 2 ? 0 : 11 - remainder;
    return `${first}${second}`;
  };

  const findCpf = (predicate) => {
    for (let i = 1; i < 10000; i++) {
      const base = String(i).padStart(9, '0');
      if (/^(\d)\1{8}$/.test(base)) {
        continue;
      }
      const digits = computeCpfCheckDigits(base);
      const first = Number(digits[0]);
      const second = Number(digits[1]);
      if (predicate({ first, second })) {
        return `${base}${digits}`;
      }
    }
    throw new Error('Unable to generate CPF for test');
  };

  test('isValidCNPJ validates known valid and invalid values', () => {
    expect(isValidCNPJ('04.252.011/0001-10')).toBe(true);
    expect(isValidCNPJ('04252011000110')).toBe(true);
    expect(isValidCNPJ('11.111.111/1111-11')).toBe(false);
    expect(isValidCNPJ('123')).toBe(false);
  });

  test('isValidCNPJ handles empty input and check digit mismatches', () => {
    const cnpjWithFirstZero = findCnpj(({ first, second }) => first === 0 && second > 0);
    const invalidCnpj = `${cnpjWithFirstZero.slice(0, 12)}99`;

    expect(isValidCNPJ(null)).toBe(false);
    expect(isValidCNPJ(invalidCnpj)).toBe(false);
    expect(isValidCNPJ(cnpjWithFirstZero)).toBe(true);
  });

  test('isValidCPF validates known valid and invalid values', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true);
    expect(isValidCPF('52998224725')).toBe(true);
    expect(isValidCPF('111.111.111-11')).toBe(false);
    expect(isValidCPF('123')).toBe(false);
  });

  test('isValidCPF handles empty input and check digit mismatches', () => {
    const cpfWithFirstZero = findCpf(({ first, second }) => first === 0 && second > 0);
    const invalidCpf = `${cpfWithFirstZero.slice(0, 9)}99`;
    const cpfWithSecondZero = findCpf(({ second }) => second === 0);

    expect(isValidCPF(undefined)).toBe(false);
    expect(isValidCPF(invalidCpf)).toBe(false);
    expect(isValidCPF(cpfWithFirstZero)).toBe(true);
    expect(isValidCPF(cpfWithSecondZero)).toBe(true);
  });

  test('identifyDocumentType detects CNPJ, CPF, and invalid', () => {
    expect(identifyDocumentType('04.252.011/0001-10')).toEqual({
      type: 'cnpj',
      isValid: true,
    });
    expect(identifyDocumentType('529.982.247-25')).toEqual({
      type: 'cpf',
      isValid: true,
    });
    expect(identifyDocumentType('123')).toEqual({
      type: 'invalid',
      isValid: false,
    });
    expect(identifyDocumentType('')).toEqual({
      type: 'invalid',
      isValid: false,
    });
  });

  test('formatCNPJ formats valid length and leaves invalid length unchanged', () => {
    expect(formatCNPJ('04252011000110')).toBe('04.252.011/0001-10');
    expect(formatCNPJ('12')).toBe('12');
    expect(formatCNPJ('')).toBe('');
  });

  test('formatCPF formats valid length and leaves invalid length unchanged', () => {
    expect(formatCPF('52998224725')).toBe('529.982.247-25');
    expect(formatCPF('12')).toBe('12');
    expect(formatCPF('')).toBe('');
  });

  test('default export exposes all functions', () => {
    expect(validators.isValidCNPJ).toBe(isValidCNPJ);
    expect(validators.isValidCPF).toBe(isValidCPF);
    expect(validators.identifyDocumentType).toBe(identifyDocumentType);
    expect(validators.formatCNPJ).toBe(formatCNPJ);
    expect(validators.formatCPF).toBe(formatCPF);
  });
});

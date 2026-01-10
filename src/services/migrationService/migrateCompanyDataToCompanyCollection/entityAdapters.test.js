/**
 * Unit tests for Entity Adapters
 * Tests CompanyAdapter, PersonAdapter, AnonymousPersonAdapter, and EntityFactory
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { ENTITY_STATUS } from './types.js';

// Mock the external formatCPF function
jest.unstable_mockModule(
  '../../../infrastructure/validators/index.js',
  () => ({
    formatCPF: jest.fn(),
  })
);

const { formatCPF } = await import(
  '../../../infrastructure/validators/index.js'
);

const {
  CompanyAdapter,
  PersonAdapter,
  AnonymousPersonAdapter,
  EntityFactory,
} = await import('./entityAdapters.js');

describe('Entity Adapters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CompanyAdapter', () => {
    describe('fromTransaction', () => {
      test('should return null for transaction without companyCnpj', () => {
        const testCases = [
          {},
          { companyCnpj: '' },
          { companyCnpj: '   ' },
          { companyCnpj: null },
          { companyCnpj: undefined },
        ];

        testCases.forEach((transaction) => {
          expect(CompanyAdapter.fromTransaction(transaction)).toBeNull();
        });
      });

      test('should create company object with all required fields', () => {
        const transaction = {
          companyCnpj: '12.345.678/0001-95',
          companyName: 'Test Company Ltd',
          companySellerName: 'John Seller',
          _id: 'transaction123',
        };

        const result = CompanyAdapter.fromTransaction(transaction);

        expect(result).toBeDefined();
        expect(result.companyCnpj).toBe('12.345.678/0001-95');
        expect(result.companyName).toBe('Test Company Ltd');
        expect(result.corporateName).toBe('Test Company Ltd');
        expect(result.tradeName).toBe('Test Company Ltd');
        // companySellerName is not a top level field in schema, should be in corporateStructure
      });

      test('should handle missing optional fields gracefully', () => {
        const transaction = {
          companyCnpj: '12.345.678/0001-95',
        };

        const result = CompanyAdapter.fromTransaction(transaction);

        expect(result).toBeDefined();
        expect(result.companyName).toBe('');
        expect(result.corporateName).toBe('');
        expect(result.tradeName).toBe('');
      });

      test('should create correct registration info structure', () => {
        const transaction = {
          companyCnpj: '12.345.678/0001-95',
          companyName: 'Test Company',
        };

        const result = CompanyAdapter.fromTransaction(transaction);

        expect(result.companySize).toBe('');
        expect(result.legalNature).toBe('');
        expect(result.shareCapital).toBe('');
        expect(result.status).toBe(ENTITY_STATUS.ACTIVE);
      });

      test('should create correct contacts structure', () => {
        const transaction = {
          companyCnpj: '12.345.678/0001-95',
        };

        const result = CompanyAdapter.fromTransaction(transaction);

        expect(result.contacts).toEqual({
          email: '',
          phones: [],
          website: '',
          socialMedia: [],
        });
      });

      test('should create correct address structure', () => {
        const transaction = {
          companyCnpj: '12.345.678/0001-95',
        };

        const result = CompanyAdapter.fromTransaction(transaction);

        expect(result.address).toEqual({
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'Brasil',
        });
      });

      test('should create administrators when companySellerName exists', () => {
        const transaction = {
          companyCnpj: '12.345.678/0001-95',
          companySellerName: 'John Seller',
        };

        const result = CompanyAdapter.fromTransaction(transaction);

        expect(result.corporateStructure).toHaveLength(1);
        expect(result.corporateStructure[0]).toEqual({
          name: 'John Seller',
          type: 'Vendedor',
          cnpj: '',
          country: 'Brasil',
        });
      });

      test('should create empty administrators when companySellerName is missing', () => {
        const transaction = {
          companyCnpj: '12.345.678/0001-95',
        };

        const result = CompanyAdapter.fromTransaction(transaction);

        expect(result.corporateStructure).toHaveLength(0);
      });

      test('should set correct metadata fields', () => {
        const transaction = {
          companyCnpj: '12.345.678/0001-95',
        };

        const result = CompanyAdapter.fromTransaction(transaction);

        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('PersonAdapter', () => {
    describe('fromTransaction', () => {
      beforeEach(() => {
        formatCPF.mockReturnValue('123.456.789-01');
      });

      test('should return null for transaction without companyCnpj', () => {
        const testCases = [
          {},
          { companyCnpj: null },
          { companyCnpj: undefined },
        ];

        testCases.forEach((transaction) => {
          expect(PersonAdapter.fromTransaction(transaction)).toBeNull();
        });
      });

      test('should create person object with formatted CPF', () => {
        const transaction = {
          companyCnpj: '12345678901',
          companyName: 'John Doe',
          _id: 'transaction123',
        };

        const result = PersonAdapter.fromTransaction(transaction);

        expect(formatCPF).toHaveBeenCalledWith('12345678901');
        expect(result.cpf).toBe('123.456.789-01');
      });

      test('should use companyName as fullName when available', () => {
        const transaction = {
          companyCnpj: '12345678901',
          companyName: 'John Doe',
        };

        const result = PersonAdapter.fromTransaction(transaction);

        expect(result.fullName).toBe('John Doe');
      });

      test('should use companySellerName when companyName is not available', () => {
        const transaction = {
          companyCnpj: '12345678901',
          companySellerName: 'Jane Smith',
        };

        const result = PersonAdapter.fromTransaction(transaction);

        expect(result.fullName).toBe('Jane Smith');
      });

      test('should use default name when neither name is available', () => {
        const transaction = {
          companyCnpj: '12345678901',
        };

        const result = PersonAdapter.fromTransaction(transaction);

        expect(result.fullName).toBe('Nome não informado');
      });

      test('should set correct default values', () => {
        const transaction = {
          companyCnpj: '12345678901',
          _id: 'transaction123',
        };

        const result = PersonAdapter.fromTransaction(transaction);

        expect(result.status).toBe(ENTITY_STATUS.ACTIVE);
        expect(result.sourceTransaction).toBe('transaction123');
        expect(result.personalBusiness.hasPersonalBusiness).toBe(false);
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
      });

      test('should add notes when seller name differs from company name', () => {
        const transaction = {
          companyCnpj: '12345678901',
          companyName: 'John Doe',
          companySellerName: 'Jane Smith',
        };

        const result = PersonAdapter.fromTransaction(transaction);

        expect(result.notes).toBe('Nome do vendedor: Jane Smith');
      });

      test('should not add notes when seller name equals company name', () => {
        const transaction = {
          companyCnpj: '12345678901',
          companyName: 'John Doe',
          companySellerName: 'John Doe',
        };

        const result = PersonAdapter.fromTransaction(transaction);

        expect(result.notes).toBeUndefined();
      });

      test('should not add notes when seller name is missing', () => {
        const transaction = {
          companyCnpj: '12345678901',
          companyName: 'John Doe',
        };

        const result = PersonAdapter.fromTransaction(transaction);

        expect(result.notes).toBeUndefined();
      });
    });
  });

  describe('AnonymousPersonAdapter', () => {
    describe('fromTransaction', () => {
      test('should return null for transaction without companyCnpj', () => {
        const testCases = [
          {},
          { companyCnpj: null },
          { companyCnpj: undefined },
        ];

        testCases.forEach((transaction) => {
          expect(
            AnonymousPersonAdapter.fromTransaction(transaction)
          ).toBeNull();
        });
      });

      test('should create anonymous person with anonymized CPF unchanged', () => {
        const transaction = {
          companyCnpj: '123.***.*89-12',
          companyName: 'Anonymous Person',
          _id: 'transaction123',
        };

        const result = AnonymousPersonAdapter.fromTransaction(transaction);

        expect(result.cpf).toBe('123.***.*89-12'); // Should keep anonymized format
        expect(formatCPF).not.toHaveBeenCalled(); // Should not format anonymized CPF
      });

      test('should use companyName as fullName when available', () => {
        const transaction = {
          companyCnpj: '123.***.*89-12',
          companyName: 'John Doe Anonymous',
        };

        const result = AnonymousPersonAdapter.fromTransaction(transaction);

        expect(result.fullName).toBe('John Doe Anonymous');
      });

      test('should use companySellerName when companyName is not available', () => {
        const transaction = {
          companyCnpj: '123.***.*89-12',
          companySellerName: 'Jane Smith Anonymous',
        };

        const result = AnonymousPersonAdapter.fromTransaction(transaction);

        expect(result.fullName).toBe('Jane Smith Anonymous');
      });

      test('should use default anonymous name when neither name is available', () => {
        const transaction = {
          companyCnpj: '123.***.*89-12',
        };

        const result = AnonymousPersonAdapter.fromTransaction(transaction);

        expect(result.fullName).toBe('Pessoa Anônima');
      });

      test('should set correct status and default values', () => {
        const transaction = {
          companyCnpj: '123.***.*89-12',
          _id: 'transaction123',
        };

        const result = AnonymousPersonAdapter.fromTransaction(transaction);

        expect(result.status).toBe(ENTITY_STATUS.ANONYMOUS);
        expect(result.notes).toBe(
          'Pessoa criada a partir de CPF anonimizado em transação'
        );
        expect(result.sourceTransaction).toBe('transaction123');
        expect(result.personalBusiness.hasPersonalBusiness).toBe(false);
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
      });

      test('should append seller info to notes when seller name differs', () => {
        const transaction = {
          companyCnpj: '123.***.*89-12',
          companyName: 'Anonymous Person',
          companySellerName: 'John Seller',
        };

        const result = AnonymousPersonAdapter.fromTransaction(transaction);

        expect(result.notes).toBe(
          'Pessoa criada a partir de CPF anonimizado em transação. Vendedor: John Seller'
        );
      });

      test('should not append seller info when seller name equals company name', () => {
        const transaction = {
          companyCnpj: '123.***.*89-12',
          companyName: 'John Seller',
          companySellerName: 'John Seller',
        };

        const result = AnonymousPersonAdapter.fromTransaction(transaction);

        expect(result.notes).toBe(
          'Pessoa criada a partir de CPF anonimizado em transação'
        );
      });
    });
  });

  describe('EntityFactory', () => {
    describe('createEntity', () => {
      beforeEach(() => {
        formatCPF.mockReturnValue('123.456.789-01');
      });

      test('should create company for cnpj document type', () => {
        const transaction = {
          companyCnpj: '12.345.678/0001-95',
          companyName: 'Test Company',
        };

        const result = EntityFactory.createEntity(transaction, 'cnpj');

        expect(result).toBeDefined();
        expect(result.companyCnpj).toBe('12.345.678/0001-95');
        expect(result.companyName).toBe('Test Company');
        expect(result.dataSource).toBe('transaction-migration');
      });

      test('should create person for cpf document type', () => {
        const transaction = {
          companyCnpj: '12345678901',
          companyName: 'John Doe',
        };

        const result = EntityFactory.createEntity(transaction, 'cpf');

        expect(result).toBeDefined();
        expect(result.cpf).toBe('123.456.789-01');
        expect(result.fullName).toBe('John Doe');
        expect(result.status).toBe(ENTITY_STATUS.ACTIVE);
      });

      test('should create anonymous person for anonymized_cpf document type', () => {
        const transaction = {
          companyCnpj: '123.***.*89-12',
          companyName: 'Anonymous Person',
        };

        const result = EntityFactory.createEntity(
          transaction,
          'anonymized_cpf'
        );

        expect(result).toBeDefined();
        expect(result.cpf).toBe('123.***.*89-12');
        expect(result.fullName).toBe('Anonymous Person');
        expect(result.status).toBe(ENTITY_STATUS.ANONYMOUS);
      });

      test('should return null for invalid document type', () => {
        const transaction = {
          companyCnpj: '12345678901',
          companyName: 'Test',
        };

        const testCases = ['invalid', 'unknown', '', null, undefined];

        testCases.forEach((documentType) => {
          const result = EntityFactory.createEntity(transaction, documentType);
          expect(result).toBeNull();
        });
      });

      test('should return null when adapter returns null', () => {
        // Transaction without companyCnpj should make all adapters return null
        const transaction = {};

        const result1 = EntityFactory.createEntity(transaction, 'cnpj');
        const result2 = EntityFactory.createEntity(transaction, 'cpf');
        const result3 = EntityFactory.createEntity(
          transaction,
          'anonymized_cpf'
        );

        expect(result1).toBeNull();
        expect(result2).toBeNull();
        expect(result3).toBeNull();
      });
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      formatCPF.mockReturnValue('123.456.789-01');
    });

    test('should handle complete workflow for different document types', () => {
      const baseTransaction = {
        _id: 'transaction123',
        companyName: 'Test Entity',
        companySellerName: 'John Seller',
      };

      // Test CNPJ workflow
      const cnpjTransaction = {
        ...baseTransaction,
        companyCnpj: '12.345.678/0001-95',
      };
      const company = EntityFactory.createEntity(cnpjTransaction, 'cnpj');
      expect(company.companyCnpj).toBe('12.345.678/0001-95');
      expect(company.dataSource).toBe('transaction-migration');

      // Test CPF workflow
      const cpfTransaction = {
        ...baseTransaction,
        companyCnpj: '12345678901',
      };
      const person = EntityFactory.createEntity(cpfTransaction, 'cpf');
      expect(person.cpf).toBe('123.456.789-01');
      expect(person.status).toBe(ENTITY_STATUS.ACTIVE);

      // Test anonymized CPF workflow
      const anonymizedTransaction = {
        ...baseTransaction,
        companyCnpj: '123.***.*89-12',
      };
      const anonymousPerson = EntityFactory.createEntity(
        anonymizedTransaction,
        'anonymized_cpf'
      );
      expect(anonymousPerson.cpf).toBe('123.***.*89-12');
      expect(anonymousPerson.status).toBe(ENTITY_STATUS.ANONYMOUS);
    });

    test('should maintain consistent timestamp behavior across adapters', () => {
      const transaction = {
        companyCnpj: '12345678901',
        companyName: 'Test',
      };

      const beforeTime = new Date();

      const company = EntityFactory.createEntity(
        { ...transaction, companyCnpj: '12.345.678/0001-95' },
        'cnpj'
      );
      const person = EntityFactory.createEntity(transaction, 'cpf');
      const anonymousPerson = EntityFactory.createEntity(
        { ...transaction, companyCnpj: '123.***.*89-12' },
        'anonymized_cpf'
      );

      const afterTime = new Date();

      [company, person, anonymousPerson].forEach((entity) => {
        expect(entity.createdAt).toBeInstanceOf(Date);
        expect(entity.updatedAt).toBeInstanceOf(Date);
        expect(entity.createdAt.getTime()).toBeGreaterThanOrEqual(
          beforeTime.getTime()
        );
        expect(entity.createdAt.getTime()).toBeLessThanOrEqual(
          afterTime.getTime()
        );
      });
    });
  });
});

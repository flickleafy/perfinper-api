import { jest } from '@jest/globals';

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const CompanyModel = {
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

const sessionFactory = () => ({
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
});

const startSession = jest.fn();
const mongooseMock = {
  connection: { readyState: 0 },
  connect: jest.fn(),
  startSession,
};

jest.unstable_mockModule('../../../models/CompanyModel.js', () => ({
  default: CompanyModel,
}));

jest.unstable_mockModule('mongoose', () => ({
  default: mongooseMock,
  connection: mongooseMock.connection,
  connect: mongooseMock.connect,
  startSession,
}));

jest.unstable_mockModule('dotenv', () => ({
  default: { config: jest.fn() },
}));

jest.unstable_mockModule('../../../config/logger.js', () => ({
  default: logger,
}));

const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

const {
  fixCompaniesEntities,
  ensureNestedStructure,
  fixCompanyBasicInfo,
  fixCompanyStructure,
  logResults,
} = await import('./index.js');

describe('fixCompaniesEntities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mongooseMock.connection.readyState = 0;
  });

  afterAll(() => {
    consoleLog.mockRestore();
  });

  test('dry run processes companies and records failures', async () => {
    const goodCompany = {
      _id: '1',
      companyName: 'Good',
      companyCnpj: '123',
      companySeller: 'Seller',
      toObject: () => ({
        companyName: 'Good',
        companyCnpj: '123',
        contacts: { phones: ['1'], socialMedia: [{ platform: 'X' }] },
        address: { city: 'City' },
        statistics: { totalTransactions: 1 },
      }),
    };
    const failingCompanies = Array.from({ length: 4 }, (_, idx) => ({
      _id: `fail-${idx}`,
      companyName: `Bad ${idx}`,
      companyCnpj: `CNPJ-${idx}`,
      toObject: () => {
        throw new Error('boom');
      },
    }));

    CompanyModel.find.mockResolvedValue([goodCompany, ...failingCompanies]);

    const stats = await fixCompaniesEntities(true);

    expect(mongooseMock.connect).toHaveBeenCalled();
    expect(startSession).not.toHaveBeenCalled();
    expect(CompanyModel.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(stats.total).toBe(5);
    expect(stats.fixed).toBe(1);
    expect(stats.failed).toBe(4);
    expect(stats.errors).toHaveLength(4);
  });

  test('live run updates companies and commits', async () => {
    const session = sessionFactory();
    startSession.mockResolvedValue(session);
    mongooseMock.connection.readyState = 1;

    CompanyModel.find.mockResolvedValue([
      {
        _id: '1',
        companyName: 'Good',
        companyCnpj: '123',
        toObject: () => ({
          companyName: 'Good',
          companyCnpj: '123',
        }),
      },
    ]);
    CompanyModel.findByIdAndUpdate.mockResolvedValue({ id: '1' });

    const stats = await fixCompaniesEntities(false);

    expect(startSession).toHaveBeenCalledTimes(1);
    expect(session.startTransaction).toHaveBeenCalledTimes(1);
    expect(CompanyModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        companyName: 'Good',
        companyCnpj: '123',
      }),
      { session }
    );
    expect(session.commitTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
    expect(stats.total).toBe(1);
    expect(stats.fixed).toBe(1);
  });

  test('live run aborts on error', async () => {
    const session = sessionFactory();
    startSession.mockResolvedValue(session);
    mongooseMock.connection.readyState = 1;

    CompanyModel.find.mockRejectedValue(new Error('db'));

    await expect(fixCompaniesEntities(false)).rejects.toThrow('db');

    expect(session.abortTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });
});

describe('fixCompaniesEntities helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ensureNestedStructure creates nested objects when missing', () => {
    const company = {};

    ensureNestedStructure(company, 'contacts.email', '');

    expect(company.contacts).toEqual({ email: '' });
  });

  test('ensureNestedStructure does not overwrite existing objects', () => {
    const company = { contacts: { email: 'existing' } };

    ensureNestedStructure(company, 'contacts.email', '');

    expect(company.contacts).toEqual({ email: 'existing' });
  });

  test('fixCompanyBasicInfo applies defaults and preserves flags', () => {
    const result = fixCompanyBasicInfo({
      companyName: 'Acme',
      companyCnpj: '123',
      microEntrepreneurOption: true,
      simplifiedTaxOption: true,
    });

    expect(result.companyName).toBe('Acme');
    expect(result.companyCnpj).toBe('123');
    expect(result.microEntrepreneurOption).toBe(true);
    expect(result.simplifiedTaxOption).toBe(true);
  });

  test('fixCompanyBasicInfo falls back when names are missing', () => {
    const result = fixCompanyBasicInfo({
      corporateName: 'Corp Name',
      tradeName: 'Trade Name',
    });

    expect(result.companyName).toBe('');
    expect(result.companyCnpj).toBe('');
    expect(result.corporateName).toBe('Corp Name');
    expect(result.tradeName).toBe('Trade Name');
  });

  test('fixCompanyStructure populates expected fields', () => {
    const createdAt = new Date('2020-01-01T00:00:00.000Z');
    const fixed = fixCompanyStructure({
      _id: 'company-id',
      companyName: 'Acme',
      companyCnpj: '123',
      contacts: {
        email: 'info@acme.com',
        phones: ['1'],
        website: 'https://acme.test',
        socialMedia: [
          { platform: 'X', handle: 'acme', isActive: false },
          {},
        ],
      },
      address: {
        street: 'Main',
        number: '10',
        city: 'Sao Paulo',
        state: 'SP',
      },
      activities: {
        primary: { code: '1', description: 'Primary' },
        secondary: [{ code: '2' }, {}],
      },
      corporateStructure: [{ name: 'Owner' }, { type: 'Partner' }],
      companySeller: 'Seller',
      createdAt,
      statistics: { totalTransactions: 1, totalTransactionValue: '10' },
      sourceTransaction: { id: 'source' },
    });

    expect(fixed.contacts.email).toBe('info@acme.com');
    expect(fixed.contacts.socialMedia[0]).toEqual({
      platform: 'X',
      handle: 'acme',
      url: '',
      isActive: false,
    });
    expect(fixed.corporateStructure).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Owner' }),
        expect.objectContaining({ name: 'Seller', type: 'Vendedor' }),
      ])
    );
    expect(fixed._id).toBe('company-id');
    expect(fixed.createdAt).toBe(createdAt);
    expect(fixed.sourceTransaction).toEqual({ id: 'source' });
  });

  test('fixCompanyStructure handles social media mapping errors', () => {
    const badItem = {};
    Object.defineProperty(badItem, 'platform', {
      get() {
        throw new Error('bad social');
      },
    });

    const fixed = fixCompanyStructure({
      companyCnpj: '321',
      contacts: {
        socialMedia: [badItem],
      },
    });

    expect(logger.warn).toHaveBeenCalled();
    expect(fixed.contacts.socialMedia).toEqual([]);
  });

  test('fixCompanyStructure handles contact access errors', () => {
    const company = {
      companyCnpj: '999',
    };
    Object.defineProperty(company, 'contacts', {
      get() {
        throw new Error('bad contacts');
      },
    });

    const fixed = fixCompanyStructure(company);

    expect(logger.warn).toHaveBeenCalled();
    expect(fixed.contacts).toEqual({
      email: '',
      phones: [],
      website: '',
      socialMedia: [],
    });
  });

  test('fixCompanyStructure falls back on nested field errors', () => {
    const company = {
      companyCnpj: '000',
      contacts: {},
    };

    Object.defineProperty(company, 'address', {
      get() {
        throw new Error('bad address');
      },
    });
    Object.defineProperty(company, 'activities', {
      get() {
        throw new Error('bad activities');
      },
    });
    Object.defineProperty(company, 'corporateStructure', {
      get() {
        throw new Error('bad corporate');
      },
    });
    Object.defineProperty(company, 'companySeller', {
      get() {
        throw new Error('bad seller');
      },
    });
    Object.defineProperty(company, '_id', {
      get() {
        throw new Error('bad id');
      },
    });
    Object.defineProperty(company, 'createdAt', {
      get() {
        throw new Error('bad created');
      },
    });
    Object.defineProperty(company, 'statistics', {
      get() {
        throw new Error('bad stats');
      },
    });
    Object.defineProperty(company, 'sourceTransaction', {
      get() {
        throw new Error('bad source');
      },
    });

    const fixed = fixCompanyStructure(company);

    expect(fixed.address).toEqual(
      expect.objectContaining({ country: 'Brasil' })
    );
    expect(fixed.activities).toEqual(
      expect.objectContaining({ primary: { code: '', description: '' } })
    );
    expect(fixed.corporateStructure).toEqual([]);
    expect(fixed.statistics).toEqual(
      expect.objectContaining({ totalTransactions: 0 })
    );
  });

  test('fixCompanyStructure uses company name in fallback when possible', () => {
    const company = {
      companyName: 'Broken Company',
    };
    Object.defineProperty(company, 'corporateName', {
      get() {
        throw new Error('bad corporate');
      },
    });

    const result = fixCompanyStructure(company);

    expect(logger.error).toHaveBeenCalled();
    expect(result.companyName).toBe('Broken Company');
  });

  test('fixCompanyStructure returns fallback on unexpected errors', () => {
    const result = fixCompanyStructure(null);

    expect(logger.error).toHaveBeenCalled();
    expect(result.companyName).toBe('Error - Unknown Company');
    expect(result.contacts).toEqual(
      expect.objectContaining({ email: '', phones: [], website: '' })
    );
  });

  test('logResults handles zero totals and many errors', () => {
    const stats = {
      total: 0,
      fixed: 0,
      failed: 5,
      warnings: 0,
      errors: ['e1', 'e2', 'e3', 'e4', 'e5'],
    };

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    logResults(stats);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('0.00%')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('... and 2 more errors')
    );

    consoleSpy.mockRestore();
  });
});

import PersonModel from './PersonModel.js';

const runPreSaveHooks = async (model, doc) => {
  const hooks = model.schema.s.hooks._pres.get('save') || [];
  for (const hook of hooks) {
    await new Promise((resolve, reject) => {
      const done = (err) => (err ? reject(err) : resolve());
      try {
        if (hook.fn.length === 0) {
          const result = hook.fn.call(doc);
          if (result && typeof result.then === 'function') {
            result.then(resolve).catch(reject);
          } else {
            resolve();
          }
          return;
        }
        if (hook.fn.length === 1) {
          hook.fn.call(doc, done);
          return;
        }
        hook.fn.call(doc, done, {});
      } catch (error) {
        reject(error);
      }
    });
  }
};

describe('PersonModel', () => {
  test('displayName uses fullName or fallback', () => {
    const named = new PersonModel({
      fullName: 'Ana Silva',
      cpf: '12345678901',
    });
    const unnamed = new PersonModel({
      fullName: '',
      cpf: '98765432100',
    });

    expect(named.displayName).toBe('Ana Silva');
    expect(unnamed.displayName).toBe('Pessoa sem nome');
  });

  test('fullAddress builds from address fields and handles missing address', () => {
    const withAddress = new PersonModel({
      fullName: 'Joao Souza',
      cpf: '11122233344',
      address: {
        street: 'Rua A',
        number: '10',
        neighborhood: 'Centro',
        city: 'Sao Paulo',
        state: 'SP',
        zipCode: '01000-000',
      },
    });
    const withoutAddress = new PersonModel({
      fullName: 'Maria Lima',
      cpf: '55566677788',
    });

    expect(withAddress.fullAddress).toBe(
      'Rua A, 10, Centro, Sao Paulo, SP, CEP: 01000-000'
    );
    expect(withoutAddress.fullAddress).toBe('');

    const json = withAddress.toJSON();
    expect(json.displayName).toBe('Joao Souza');
    expect(json.fullAddress).toBe(
      'Rua A, 10, Centro, Sao Paulo, SP, CEP: 01000-000'
    );
  });

  test('fullAddress returns empty string when address is null', () => {
    const withoutAddress = new PersonModel({
      fullName: 'Null Address',
      cpf: '11122233355',
    });
    withoutAddress.address = undefined;

    expect(withoutAddress.fullAddress).toBe('');
  });

  test('primaryContact prefers email, then phone, then cellphone', () => {
    const withEmail = new PersonModel({
      fullName: 'A',
      cpf: '00011122233',
      contacts: {
        emails: ['a@example.com'],
        phones: ['1111'],
        cellphones: ['2222'],
      },
    });
    const withPhone = new PersonModel({
      fullName: 'B',
      cpf: '00011122234',
      contacts: {
        emails: [],
        phones: ['3333'],
        cellphones: ['4444'],
      },
    });
    const withCell = new PersonModel({
      fullName: 'C',
      cpf: '00011122235',
      contacts: {
        emails: [],
        phones: [],
        cellphones: ['5555'],
      },
    });
    const withoutContacts = new PersonModel({
      fullName: 'D',
      cpf: '00011122236',
      contacts: {
        emails: [],
        phones: [],
        cellphones: [],
      },
    });

    expect(withEmail.primaryContact).toBe('a@example.com');
    expect(withPhone.primaryContact).toBe('3333');
    expect(withCell.primaryContact).toBe('5555');
    expect(withoutContacts.primaryContact).toBeNull();
  });

  test('pre save hook updates updatedAt', async () => {
    const doc = new PersonModel({
      fullName: 'Carlos',
      cpf: '12312312399',
    });
    doc.updatedAt = new Date(0);

    await runPreSaveHooks(PersonModel, doc);

    expect(doc.updatedAt).toBeInstanceOf(Date);
    expect(doc.updatedAt.getTime()).toBeGreaterThan(0);
  });
});

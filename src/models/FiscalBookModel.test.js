import FiscalBookModel from './FiscalBookModel.js';

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

describe('FiscalBookModel', () => {
  test('toJSON transform removes _id/__v and adds id', () => {
    const doc = new FiscalBookModel({
      bookName: 'Entrada 2024',
      bookType: 'Entrada',
      bookPeriod: '2024-01',
    });
    doc.set('__v', 3);

    const json = doc.toJSON();

    expect(json._id).toBeUndefined();
    expect(json.__v).toBeUndefined();
    expect(json.id.toString()).toBe(doc._id.toString());
    expect(json.bookName).toBe('Entrada 2024');
    expect(json.bookType).toBe('Entrada');
    expect(json.bookPeriod).toBe('2024-01');
  });

  test('pre save hook updates updatedAt', async () => {
    const doc = new FiscalBookModel({
      bookName: 'Entrada 2024',
      bookType: 'Entrada',
      bookPeriod: '2024-01',
    });
    doc.updatedAt = new Date(0);

    await runPreSaveHooks(FiscalBookModel, doc);

    expect(doc.updatedAt).toBeInstanceOf(Date);
    expect(doc.updatedAt.getTime()).toBeGreaterThan(0);
  });
});

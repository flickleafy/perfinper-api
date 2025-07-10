import CategoryModel from './CategoryModel.js';

describe('CategoryModel', () => {
  test('toJSON/toObject transform id and remove _id/__v', () => {
    const doc = new CategoryModel({ name: 'Food', iconName: 'utensils' });
    doc.set('__v', 2);

    const json = doc.toJSON();
    const obj = doc.toObject();

    expect(json._id).toBeUndefined();
    expect(json.__v).toBeUndefined();
    expect(json.id.toString()).toBe(doc._id.toString());
    expect(json.name).toBe('Food');
    expect(json.iconName).toBe('utensils');

    expect(obj._id).toBeUndefined();
    expect(obj.__v).toBeUndefined();
    expect(obj.id.toString()).toBe(doc._id.toString());
    expect(obj.name).toBe('Food');
    expect(obj.iconName).toBe('utensils');
  });
});

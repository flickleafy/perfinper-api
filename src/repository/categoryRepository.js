import CategoryModel from '../models/CategoryModel.js';

export async function findAll() {
  try {
    const categories = await CategoryModel.find({}).sort({ name: 1 });
    return categories;
  } catch (error) {
    console.error('Error finding all categories:', error.message);
    throw new Error('Failed to retrieve categories.');
  }
}

export async function deleteById(id) {
  try {
    const result = await CategoryModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error('No category found with the provided ID.');
    }
    return result;
  } catch (error) {
    console.error('Error deleting category by ID:', error.message);
    throw new Error('Failed to delete category.');
  }
}

export async function updateById(id, categoryObject) {
  try {
    const category = await CategoryModel.findByIdAndUpdate(id, categoryObject, {
      new: true,
    });
    if (!category) {
      throw new Error('No category found with the provided ID.');
    }
    return category;
  } catch (error) {
    console.error('Error updating category by ID:', error.message);
    throw new Error('Failed to update category.');
  }
}

export async function findById(id) {
  try {
    const category = await CategoryModel.findById(id);
    if (!category) {
      throw new Error('No category found with the provided ID.');
    }
    return category;
  } catch (error) {
    console.error('Error finding category by ID:', error.message);
    throw new Error('Failed to find category.');
  }
}

export async function insert(categoryObject) {
  try {
    const category = new CategoryModel(categoryObject);
    await category.save();
    return category;
  } catch (error) {
    console.error('Error inserting new category:', error.message);
    throw new Error('Failed to insert new category.');
  }
}

import CategoryModel from '../models/CategoryModel.js';

export async function findAll() {
  try {
    const categories = await CategoryModel.aggregate([
      { $project: { id: '$_id', _id: 0, name: 1, iconName: 1 } },
      { $sort: { name: 1 } },
    ]);
    return categories;
  } catch (error) {
    // Handle or log the error appropriately
    console.error('Error finding all categories:', error);
    throw new Error('Failed to retrieve categories.');
  }
}

export async function deleteById(id) {
  try {
    const result = await CategoryModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error('No category found with given ID.');
    }
    return result;
  } catch (error) {
    console.error('Error deleting category by ID:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

export async function updateById(id, newCategoryObject) {
  try {
    const category = await CategoryModel.findByIdAndUpdate(
      id,
      newCategoryObject,
      { new: true }
    );
    if (!category) {
      throw new Error('No category found with given ID.');
    }
    return category;
  } catch (error) {
    console.error('Error updating category by ID:', error);
    throw error;
  }
}

export async function findById(id) {
  try {
    const category = await CategoryModel.findById(id);
    if (!category) {
      throw new Error('No category found with given ID.');
    }
    return category;
  } catch (error) {
    console.error('Error finding category by ID:', error);
    throw error;
  }
}

export async function insert(categoryPrototype) {
  try {
    const category = new CategoryModel(categoryPrototype);
    await category.save();
    return category;
  } catch (error) {
    console.error('Error inserting new category:', error);
    throw new Error('Failed to insert new category.');
  }
}

import mongoose from 'mongoose';

// Define the Category schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  iconName: String,
});

const transformCategoryFields = (doc, ret, options) => {
  ret.id = ret._id;
  delete ret._id; // Delete _id from the response
  delete ret.__v; // Optional: delete version key if not needed
  return ret;
};

// Ensure that _id and __v is not returned
categorySchema.set('toJSON', {
  transform: transformCategoryFields,
});

categorySchema.set('toObject', {
  transform: transformCategoryFields,
});

const CategoryModel = mongoose.model('category', categorySchema);

export default CategoryModel;

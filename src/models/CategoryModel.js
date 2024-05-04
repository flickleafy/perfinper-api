import mongoose from 'mongoose';

// Define the Category schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  iconName: String,
});

const CategoryModel = mongoose.model('category', categorySchema);

export default CategoryModel;

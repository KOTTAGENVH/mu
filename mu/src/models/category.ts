import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
  id: string;
  name: string;
}

const CategorySchema = new Schema({
  id: {
    type: String,
    required: [true, "Please provide an id"],
    unique: true,
  },
  name: {
    type: String,
    required: [true, "Please provide a category name"],
    unique: true,
  },
});
const Category =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);

export default Category;

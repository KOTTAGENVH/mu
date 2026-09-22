import mongoose, { Document, Schema } from "mongoose";

export interface IList extends Document {
  id: string;
  name: string;
  nameIndex: string;
}

const ListSchema = new Schema(
  {
    id: {
      type: String,
      required: [true, "Please provide an id"],
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Please provide a list name"],
      unique: true,
    },
    nameIndex: {
      type: String,
      required: [true, "Missing list name index"],
      unique: true,
    },
  },
  { timestamps: true },
);
const List = mongoose.models.List || mongoose.model<IList>("List", ListSchema);

export default List;

import mongoose, { Document, Schema } from "mongoose";

export interface IUpload extends Document {
  name: string;
  category: string;
  fileUrl: string;
  favourite: boolean;
}

const UploadSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
  },
  category: {
    type: String,
    required: [true, "Please provide a category"],
  },
  fileUrl: {
    type: String,
    required: [true, "Please provide a fileUrl"],
  },
  favourite: {
    type: Boolean,
    required: [true, "Please provide a favourite"],
  },
});

const Upload =
  mongoose.models.Upload || mongoose.model<IUpload>("Upload", UploadSchema);

export default Upload;

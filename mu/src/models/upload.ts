import mongoose, { Document, Schema } from "mongoose";

export interface IUpload extends Document {
  id: string;
  name: string;
  artist: string;
  category: mongoose.Types.ObjectId;
  fileUrl: string;
  favourite: boolean;
  lastPlayedAt?: Date;
  playCount: number;
  skipCount: number;
}

const UploadSchema = new Schema({
  id: {
    type: String,
    required: [true, "Please provide an id"],
    unique: true,
  },
  name: {
    type: String,
    required: [true, "Please provide a name"],
  },
  artist: {
    type: String,
    required: [true, "Please provide an artist"],
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "Please provide a category"],
  },
  fileUrl: {
    type: String,
    required: [true, "Please provide a fileUrl"],
  },
  favourite: {
    type: Boolean,
    default: false,
  },
  lastPlayedAt: {
    type: Date,
    default: null,
  },
  playCount: {
    type: Number,
    default: 0,
  },
  skipCount: {
    type: Number,
    default: 0,
  },
});

const Upload =
  mongoose.models.Upload || mongoose.model<IUpload>("Upload", UploadSchema);

export default Upload;

import { verify } from "crypto";
import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  email?: string;
  token: string;
  backupCodes: string[];
  verified?: boolean | false;
}

const UserSchema = new Schema({
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
  },
  token: {
    type: String,
    required: [true, "Please provide a token"],
  },
  backupCodes: {
    type: [String],
    required: [true, "Please provide backup codes"],
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

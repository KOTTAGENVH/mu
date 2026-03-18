import mongoose, { Document, Schema } from "mongoose";

export interface IRateLimit extends Document {
  ip: string;
  route: string;
  attempts: number;
  expiresAt: Date;
}

const RateLimitSchema = new Schema({
  ip: { type: String, required: true },
  route: { type: String, required: true },
  attempts: { type: Number, default: 1 },
  expiresAt: { type: Date, required: true, expires: 0 },
});

RateLimitSchema.index({ ip: 1, route: 1 }, { unique: true });

const RateLimit =
  mongoose.models.RateLimit ||
  mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);

export default RateLimit;

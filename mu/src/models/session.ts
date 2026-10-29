import mongoose, { Document, Schema } from "mongoose";

export interface IIpEntry {
  ip: string;
  seenAt: Date;
}

export interface ISession extends Document {
  sessionId: string;
  email: string;
  ip?: string;
  ipHistory: IIpEntry[];
  lastSeenAt?: Date;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>({
  sessionId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  ip: { type: String },
  ipHistory: {
    type: [{ ip: String, seenAt: Date }],
    default: [],
  },
  lastSeenAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// expire sessions after 31 days
SessionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 31 },
);

const Session =
  (mongoose.models.Session as mongoose.Model<ISession>) ||
  mongoose.model<ISession>("Session", SessionSchema);

export default Session;

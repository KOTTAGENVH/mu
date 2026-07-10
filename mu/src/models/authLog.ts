import mongoose, { Document, Schema } from "mongoose";

export enum AuthEvent {
  LOGIN = "login",
  LOGOUT = "logout",
  LOGOUT_ALL = "logout_all",
  FAILED_LOGIN = "failed_login",
}

export interface IAuthLog extends Document {
  event: AuthEvent;
  ip?: string;
  createdAt: Date;
}

const AuthLogSchema = new Schema<IAuthLog>({
  event: { type: String, enum: Object.values(AuthEvent), required: true },
  ip: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// auto delete after 90 days
AuthLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
AuthLogSchema.index({ event: 1, createdAt: -1 });

const AuthLog =
  mongoose.models.AuthLog || mongoose.model<IAuthLog>("AuthLog", AuthLogSchema);

export default AuthLog;
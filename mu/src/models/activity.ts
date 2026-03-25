import mongoose, { Document, Schema } from "mongoose";

export enum ActivityType {
  AUDIO = "audio",
  WISHLIST = "wishlist",
  CATEGORY = "category",
}

export enum ActionType {
  ADD = "add",
  EDIT = "edit",
  DELETE = "delete",
}

export interface IActivity extends Document {
  id: string;
  taskname: string;
  type: ActivityType;
  action: ActionType;
  date: string;
  time: string;
  timezone: string;
}


const ActivitySchema = new Schema<IActivity>({
  id: {
    type: String,
    required: [true, "Please provide an id"],
    unique: true,
  },
  taskname: {
    type: String,
    required: [true, "Please provide a task name"],
  },
  type: {
    type: String,
    enum: Object.values(ActivityType), 
    required: [true, "Please provide an activity type"],
  },
  action: {
    type: String,
    enum: Object.values(ActionType),
    required: [true, "Please provide an action"],
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  timezone: {
    type: String,
    required: true,
  },
});


const Activity =
  mongoose.models.Activity || mongoose.model<IActivity>("Activity", ActivitySchema);

export default Activity;
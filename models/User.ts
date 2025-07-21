import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  password: string;
  refreshToken?: {
    token: string;
    createdAt?: Date;
  };
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    refreshToken: {
      token: { type: String, required: false }, 
      createdAt: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);

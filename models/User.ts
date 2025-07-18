import mongoose, { Document, Schema } from "mongoose";

interface RefreshToken {
  token: string;
  createdAt?: Date;
}

export interface IUser extends Document {
  username: string;
  password: string;
  refreshToken: RefreshToken;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    refreshToken: {
      token: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);

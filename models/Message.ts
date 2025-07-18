import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMessage extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  content: string;
  createdAt: Date;
}

const messageSchema: Schema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId, //у цьому полі ми будемо зберігати не все ім'я користувача, 
                                  // а тільки його унікальний ідентифікатор ID з бази даних
      ref: "User", // Посилання на модель User
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Автоматично додає поля createdAt і updatedAt
  }
);

export default mongoose.model<IMessage>("Message", messageSchema);
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ChatSchema = new Schema(
    {
        members: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
        messages: [{ type: String, required: false }],
    },
    { timestamps: true }
);

export default model("Chat", ChatSchema);
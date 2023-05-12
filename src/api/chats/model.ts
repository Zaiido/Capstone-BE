import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ChatSchema = new Schema(
    {
        name: { type: String },
        members: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
        messages: [
            {
                text: { type: String, required: false },
                media: { type: String, requierd: false },
                sender: { type: Schema.Types.ObjectId, ref: "User" },
                createdAt: { type: String },
                manualId: { type: String }
            }
        ]
    },
    { timestamps: true }
);

export default model("Chat", ChatSchema);
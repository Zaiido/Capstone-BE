import mongoose from "mongoose";

const { Schema, model } = mongoose;

const postSchema = new Schema(
    {
        text: { type: String },
        image: { type: String },
        video: { type: String },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        likes: {
            default: [],
            type: [{ type: Schema.Types.ObjectId, ref: "User" }],
        },
    },
    {
        timestamps: true,
    }
);

export default model("Post", postSchema);
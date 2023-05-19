import mongoose from "mongoose";

const { Schema, model } = mongoose;

const postSchema = new Schema(
    {
        text: { type: String, required: true },
        image: { type: String },
        video: { type: String },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        likes: {
            default: [],
            type: [{ type: Schema.Types.ObjectId, ref: "User" }],
        },
        repost: { type: Schema.Types.ObjectId, ref: "Post" }
    },
    {
        timestamps: true,
    }
);

export default model("Post", postSchema);
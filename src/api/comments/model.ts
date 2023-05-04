import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const commentSchema = new Schema(
    {
        user: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        post: {
            type: mongoose.Types.ObjectId,
            ref: 'Post',
            required: true,
        },
        comment: {
            type: String,
            required: true,
        },
        likes: {
            default: [],
            type: [{ type: Schema.Types.ObjectId, ref: "User" }],
        },
    },
    {
        timestamps: true,
    }
);

export default model('Comment', commentSchema);
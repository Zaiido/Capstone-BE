import mongoose from "mongoose";

const { Schema, model } = mongoose;

const GardenSchema = new Schema(
    {
        name: { type: String },
        image: { type: String },
        owner: { type: Schema.Types.ObjectId, ref: "User", required: true },

    },
    { timestamps: true }
);

export default model("Garden", GardenSchema);
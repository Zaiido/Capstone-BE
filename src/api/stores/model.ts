import mongoose from "mongoose";

const { Schema, model } = mongoose;

const storeSchema = new Schema(
    {
        name: { type: String, required: true },
        coordinates: [{ type: Number, required: true }],
        address: {
            street: String,
            houseNumber: String,
            postcode: String,
            city: String,
            country: String
        },
        approved: { type: Boolean, default: false }

    },
    { timestamps: true }
);

export default model("Store", storeSchema);
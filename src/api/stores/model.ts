import mongoose from "mongoose";

const { Schema, model } = mongoose;

const storeSchema = new Schema(
    {
        coordinates: [{ type: Number, required: true }],
        address: {
            street: String,
            houseNumber: String,
            postcode: String,
            city: String,
            country: String
        },
        approved: { type: Boolean }

    },
    { timestamps: true }
);

export default model("Store", storeSchema);
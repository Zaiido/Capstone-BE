import mongoose from "mongoose";

const { Schema, model } = mongoose;

const deadPlantsSchema = new Schema(
    {
        deadPlants: { type: Number, default: 1 },
        owner: { type: Schema.Types.ObjectId, ref: "User", required: true },

    },
    { timestamps: true }
);

export default model("DeadPlants", deadPlantsSchema);
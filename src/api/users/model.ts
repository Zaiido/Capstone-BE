import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { UserDocument, UserModel } from "../../interfaces/IUser";

const { Schema, model } = mongoose;

const UsersSchema = new Schema(
    {
        username: { type: String, required: true },
        email: { type: String, required: true },
        password: { type: String, required: false },
        bio: { type: String, default: "" },
        avatar: {
            type: String,
            default:
                "https://img.freepik.com/free-vector/cute-cactus-concept-illustration_114360-9318.jpg?w=740&t=st=1682855386~exp=1682855986~hmac=8dccfd2fc82e437805dc87a7faf832f7ca0e90ad56983c0cd88502df2db176b6",
        },
        refreshToken: { type: String },
        googleId: { type: String },
        facebookId: { type: String },
        receivedRequests: {
            pending: [{ type: Schema.Types.ObjectId, ref: "User" }],
        },
        sentRequests: {
            pending: [{ type: Schema.Types.ObjectId, ref: "User" }],
        },
        followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
        following: [{ type: Schema.Types.ObjectId, ref: "User" }],

    },
    { timestamps: true }
);

UsersSchema.pre("save", async function () {
    const newUserData = this;

    if (newUserData.isModified("password")) {
        const plainPW = newUserData.password;

        const hash = await bcrypt.hash(plainPW!, 11);
        newUserData.password = hash;
    }
});

UsersSchema.methods.toJSON = function () {
    const currentUserDocument = this;
    const currentUser = currentUserDocument.toObject();
    delete currentUser.password;
    delete currentUser.createdAt;
    delete currentUser.updatedAt;
    delete currentUser.__v;
    delete currentUser.refreshToken
    return currentUser;
};

UsersSchema.static("checkCredentials", async function (email, plainPW) {
    const user = await this.findOne({ email });

    if (user) {
        const passwordMatch = await bcrypt.compare(plainPW, user.password);

        if (passwordMatch) {
            return user;
        } else {
            return null;
        }
    } else {
        return null;
    }
});

export default model<UserDocument, UserModel>("User", UsersSchema);
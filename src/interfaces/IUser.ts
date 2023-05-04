import { Model, Document, Types } from "mongoose";

export interface IObjectId {
    _id: Types.ObjectId
}

export interface IUser {
    username: string;
    email: string;
    password: string;
    bio?: string;
    avatar?: string;
    refreshToken: string;
    googleId: string;
    facebookId: string;
    receivedRequests: {
        pending: IObjectId[],
    },
    sendRequests: {
        pending: IObjectId[],
    },
    followers: IObjectId[],
    following: IObjectId[],
}

export interface UserDocument extends IUser, Document { }

export interface UserModel extends Model<UserDocument> {
    checkCredentials(
        email: string,
        password: string
    ): Promise<UserDocument | null>;
}
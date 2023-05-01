import { Model, Document } from "mongoose";

export interface IUser {
    username: string;
    email: string;
    password: string;
    bio?: string;
    avatar?: string;
    refreshToken: string;
}

export interface UserDocument extends IUser, Document { }

export interface UserModel extends Model<UserDocument> {
    checkCredentials(
        email: string,
        password: string
    ): Promise<UserDocument | null>;
}
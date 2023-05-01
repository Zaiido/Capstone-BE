import { Request } from "express";

export interface TokenPayload {
    _id: string;
}

export interface UserRequest extends Request {
    user?: TokenPayload;
}
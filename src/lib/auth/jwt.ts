import createHttpError from "http-errors"
import { verifyAccessToken } from "./tools"
import { RequestHandler } from "express"

export const JWTAuthMiddleware: RequestHandler = async (request: any, response, next) => {
    if (!request.headers.authorization) {
        next(createHttpError(401, "Please provide Bearer token in authorization header"))
    } else {
        const accessToken = request.headers.authorization.replace("Bearer ", "")
        try {
            const payload = await verifyAccessToken(accessToken)

            request.user = { _id: payload._id }
            next()

        } catch (error) {
            next(createHttpError(401, "Token not valid! Please log in again!"))
        }
    }
}
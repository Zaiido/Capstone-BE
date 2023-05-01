import jwt from "jsonwebtoken"
import { TokenPayload } from "../../interfaces/IAuth"
import { UserDocument } from "../../interfaces/IUser"
import UsersModel from '../../api/users/model'
import createHttpError from "http-errors"

export const createAccessToken = (payload: TokenPayload): Promise<string> =>
    new Promise((resolve, reject) =>
        jwt.sign(payload, process.env.SECRET_KEY!, { expiresIn: "1 week" }, (error, token) => {
            if (error) reject(error)
            else resolve(token as string)
        })
    )

export const verifyAccessToken = (token: string): Promise<TokenPayload> =>
    new Promise((resolve, reject) =>
        jwt.verify(token, process.env.SECRET_KEY!, (error, payload) => {
            if (error) reject(error)
            else resolve(payload as TokenPayload)
        })
    )


export const createTokens = async (user: UserDocument) => {
    const accessToken = await createAccessToken({ _id: user._id })
    const refreshToken = await createRefreshToken({ _id: user._id })

    user.refreshToken = refreshToken
    await user.save()

    return { accessToken, refreshToken }
}



export const createRefreshToken = (payload: TokenPayload): Promise<string> =>
    new Promise((resolve, reject) =>
        jwt.sign(payload, process.env.REFRESH_SECRET as string, { expiresIn: "1 day" }, (error, token) => {
            if (error) reject(error)
            else resolve(token as string)
        })
    )

const verifyRefreshToken = (token: string): Promise<TokenPayload> =>
    new Promise((resolve, reject) =>
        jwt.verify(token, process.env.REFRESH_SECRET as string, (error, payload) => {
            if (error) reject(error)
            else resolve(payload as TokenPayload)
        })
    )

export const verifyTokensAndCreateNewTokens = async (currentRefreshToken: string) => {
    try {
        const { _id } = await verifyRefreshToken(currentRefreshToken)

        const user = await UsersModel.findById(_id)
        if (!user) throw createHttpError(404, `User with id ${_id} not found!`)

        if (user.refreshToken && user.refreshToken === currentRefreshToken) {
            const { accessToken, refreshToken } = await createTokens(user)

            return { accessToken, refreshToken }
        } else {
            throw createHttpError(401, "Refresh token not valid!")
        }
    } catch (error) {
        throw createHttpError(401, "Please log in again!")
    }
}
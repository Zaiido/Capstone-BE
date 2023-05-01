import Express from "express";
import UsersModel from "./model";
import { JWTAuthMiddleware } from "../../lib/auth/jwt";
import { createAccessToken, createTokens, verifyTokensAndCreateNewTokens } from "../../lib/auth/tools";
import { checkUserSchema, generateBadRequest } from "./validation";
import { Request, Response, NextFunction } from "express";
import passport from "passport";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { Params } from "express-serve-static-core";
import createHttpError from "http-errors";

const usersRouter = Express.Router();

usersRouter.get(
    "/googleLogin",
    passport.authenticate("google", { scope: ["profile", "email"], prompt: "consent" })
);

usersRouter.get(
    "/googleRedirect",
    passport.authenticate("google", { session: false }),
    (request: any, response: Response, next: NextFunction) => {
        try {
            response.cookie("accessToken", request.user!.accessToken);
            response.redirect(`${process.env.FE_URL}`);
        } catch (error) {
            next(error);
        }
    }
);


usersRouter.get(
    "/facebookLogin",
    passport.authenticate("facebook", { scope: ["public_profile", "email"], prompt: "consent" })
);


usersRouter.get(
    "/facebookRedirect",
    passport.authenticate("facebook", { session: false }),
    (request: any, response: Response, next: NextFunction) => {
        try {
            response.cookie("accessToken", request.user!.accessToken);
            response.redirect(`${process.env.FE_URL}`);
        } catch (error) {
            next(error);
        }
    }
);



usersRouter.post("/register", checkUserSchema, generateBadRequest, async (request: Request, response: Response, next: NextFunction) => {
    try {
        const newUser = new UsersModel(request.body);
        const { _id } = await newUser.save();
        const payload = { _id: _id };
        const accessToken = await createAccessToken(payload);
        response.status(201).send({ user: newUser, accessToken: accessToken });
    } catch (error) {
        next(error);
    }
}
);


usersRouter.post("/login", async (request, response, next) => {
    try {
        const { email, password } = request.body
        const user = await UsersModel.checkCredentials(email, password)

        if (user) {
            const { accessToken, refreshToken } = await createTokens(user)
            response.send({ accessToken, refreshToken })
        } else {
            next(createHttpError(401, "Credentials are not ok!"))
        }
    } catch (error) {
        next(error)
    }
})


usersRouter.post("/refreshTokens", async (request, response, next) => {
    try {
        const { currentRefreshToken } = request.body

        const { accessToken, refreshToken } = await verifyTokensAndCreateNewTokens(currentRefreshToken)
        response.send({ accessToken, refreshToken })
    } catch (error) {
        next(error)
    }
})


usersRouter.get("/", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const users = await UsersModel.find();
        response.send(users);
    } catch (error) {
        next(error);
    }
});

usersRouter.get("/me", JWTAuthMiddleware, async (request: any, response, next) => {
    try {
        const user = await UsersModel.findById(request.user!._id);
        response.send(user);
    } catch (error) {
        next(error);
    }
});

usersRouter.put("/me", JWTAuthMiddleware, async (request: any, response, next) => {
    try {
        const updatedUser = await UsersModel.findByIdAndUpdate(
            request.user!._id,
            request.body,
            { new: true, runValidators: true }
        );
        response.send(updatedUser);
    } catch (error) {
        next(error);
    }
});

const cloudinaryUploader = multer({
    storage: new CloudinaryStorage({
        cloudinary,
        params: {
            folder: "fs0522/capstone-avatars",
        } as Params,
    }),
}).single("avatar");

usersRouter.post("/me/avatar", JWTAuthMiddleware, cloudinaryUploader, async (request: any, response, next) => {
    try {
        const user = await UsersModel.findByIdAndUpdate(
            request.user!._id,
            { ...request.body, avatar: request.file.path },
            { new: true, runValidators: true }
        );
        response.send({ user });
    } catch (error) {
        next(error);
    }
}
);

usersRouter.get("/:id", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const user = await UsersModel.findById(request.params.id);
        if (user) {
            response.send(user);
        } else {
            next(createHttpError(404, `User with id ${request.params.id} not found!`));
        }
    } catch (error) {
        next(error);
    }
});

export default usersRouter;
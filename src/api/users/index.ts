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
import mongoose, { Types } from "mongoose";

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
        const existingUser = await UsersModel.findOne({ email: request.body.email })
        if (existingUser) {
            next(createHttpError(400, "You already have an account linked to this email. Please log in instead."))
        } else {
            const newUser = new UsersModel(request.body);
            const { _id } = await newUser.save();
            const { accessToken } = await createTokens(newUser);
            response.cookie("accessToken", accessToken);
            response.status(201).send({ _id })
        }

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
            const { accessToken } = await createTokens(user)
            response.cookie("accessToken", accessToken);
            response.status(200).send()
        } else {
            next(createHttpError(401, "Invalid email or password. Please double-check your credentials and try again."))
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
            folder: "Capstone/users",
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


usersRouter.get("/:userId/receivedRequests", async (request, response, next) => {
    try {
        const user = await UsersModel.findById(
            request.params.userId,
            "receivedRequests.pending"
        ).populate(
            "receivedRequests.pending",
            "username avatar"
        );
        if (user) {
            response.send(user.receivedRequests.pending);
        } else {
            next(
                createHttpError(404, `User with id ${request.params.userId} not found!`)
            );
        }
    } catch (error) {
        next(error);
    }
});

usersRouter.get("/:userId/sentRequests", async (request, response, next) => {
    try {
        const user = await UsersModel.findById(
            request.params.userId,
            "sendRequests.pending"
        ).populate("sendRequests.pending", "username avatar");
        if (user) {
            response.send(user.sendRequests.pending);
        } else {
            next(
                createHttpError(404, `User with id ${request.params.userId} not found!`)
            );
        }
    } catch (error) {
        next(error);
    }
});

usersRouter.get("/:userId/followers", async (request, response, next) => {
    try {
        const user = await UsersModel.findById(request.params.userId, "followers").populate("followers", "username avatar");
        if (user) {
            response.send(user.followers);
        } else {
            next(
                createHttpError(404, `User with id ${request.params.userId} not found!`)
            );
        }
    } catch (error) {
        next(error);
    }
});

usersRouter.get("/:userId/following", async (request, response, next) => {
    try {
        const user = await UsersModel.findById(
            request.params.userId,
            "following"
        ).populate("following", "username avatar");
        if (user) {
            response.send(user.following);
        } else {
            next(
                createHttpError(404, `User with id ${request.params.userId} not found!`)
            );
        }
    } catch (error) {
        next(error);
    }
});

usersRouter.post("/:userId/manageRequest", async (request, response, next) => {
    try {
        const { action, senderId } = request.body;

        if (action) {
            const user = await UsersModel.findByIdAndUpdate(
                request.params.userId,
                {
                    $pull: { "receivedRequests.pending": senderId },
                    $push: { followers: senderId },
                },
                { new: true, runValidators: true }
            );
            const sender = await UsersModel.findByIdAndUpdate(
                senderId,
                {
                    $pull: { "sendRequests.pending": request.params.userId },
                    $push: { following: request.params.userId },
                },
                { new: true, runValidators: true }
            );
            response.send({ user, sender });
        } else {
            const user = await UsersModel.findByIdAndUpdate(
                request.params.userId,
                { $pull: { "receivedRequests.pending": senderId } },
                { new: true, runValidators: true }
            );
            const sender = await UsersModel.findByIdAndUpdate(
                senderId,
                { $pull: { "sendRequests.pending": request.params.userId } },
                { new: true, runValidators: true }
            );
            response.send({ user, sender });
        }
    } catch (error) {
        next(error);
    }
});


usersRouter.post("/:senderId/sendRequest", async (request, response, next) => {
    try {
        const { senderId } = request.params;
        const { receiverId } = request.body;
        const sender = await UsersModel.findById(senderId);
        const receiver = await UsersModel.findById(receiverId);


        if (sender!.following.includes(receiverId)) {
            await UsersModel.findByIdAndUpdate(
                senderId,
                { $pull: { following: receiverId } },
                { new: true, runValidators: true }
            );
            await UsersModel.findByIdAndUpdate(
                receiverId,
                { $pull: { followers: senderId } },
                { new: true, runValidators: true }
            );
            response.send({
                sender: sender!.sendRequests.pending,
                receiver: receiver!.receivedRequests.pending,
            });
        } else if (sender!.sendRequests.pending.includes(receiverId)) {
            const deleteSendRequest = await UsersModel.findByIdAndUpdate(
                request.params.senderId,
                { $pull: { "sendRequests.pending": receiverId } },
                { new: true, runValidators: true }
            );
            const deleteReceivedRequest = await UsersModel.findByIdAndUpdate(
                request.body.receiverId,
                { $pull: { "receivedRequests.pending": senderId } },
                { new: true, runValidators: true }
            );
            response.send({
                deleteSendRequest,
                deleteReceivedRequest,
            });
        } else {
            sender!.sendRequests.pending.push(receiverId);
            receiver!.receivedRequests.pending.push(new mongoose.Types.ObjectId(senderId));
            await sender!.save();
            await receiver!.save();
            response.send({
                sender: sender!.sendRequests.pending,
                receiver: receiver!.receivedRequests.pending,
                senderId: senderId,
                receiverId: receiverId,
            });
        }
    } catch (error) {
        next(error);
    }
});


usersRouter.post("/:userId/removeFollower", async (request, response, next) => {
    try {
        const { followerId } = request.body
        const user = await UsersModel.findByIdAndUpdate(
            request.params.userId,
            { $pull: { followers: followerId } },
            { new: true, runValidators: true }
        );
        response.send(user)
    } catch (error) {
        next(error)
    }
})

export default usersRouter;
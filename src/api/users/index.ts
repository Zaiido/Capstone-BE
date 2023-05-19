import Express from "express";
import UsersModel from "./model";
import { JWTAuthMiddleware } from "../../lib/auth/jwt";
import { createTokens, verifyTokensAndCreateNewTokens } from "../../lib/auth/tools";
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
            response.redirect(`${process.env.FE_URL}?accessToken=${request.user!.accessToken}`);
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
            response.redirect(`${process.env.FE_URL}?accessToken=${request.user!.accessToken}`);
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
            response.status(201).send({ _id, accessToken })
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
            response.send({ accessToken })
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


usersRouter.get("/:userId/receivedRequests", JWTAuthMiddleware, async (request, response, next) => {
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

usersRouter.get("/:userId/sentRequests", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const user = await UsersModel.findById(
            request.params.userId,
            "sentRequests.pending"
        ).populate("sentRequests.pending", "username avatar");
        if (user) {
            response.send(user.sentRequests.pending);
        } else {
            next(
                createHttpError(404, `User with id ${request.params.userId} not found!`)
            );
        }
    } catch (error) {
        next(error);
    }
});

usersRouter.get("/:userId/followers", JWTAuthMiddleware, async (request, response, next) => {
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

usersRouter.get("/:userId/following", JWTAuthMiddleware, async (request, response, next) => {
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

usersRouter.post("/:userId/manageRequest", JWTAuthMiddleware, async (request, response, next) => {
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
                    $pull: { "sentRequests.pending": request.params.userId },
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
                { $pull: { "sentRequests.pending": request.params.userId } },
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
                sender: sender!.sentRequests.pending,
                receiver: receiver!.receivedRequests.pending,
            });
        } else if (sender!.sentRequests.pending.includes(receiverId)) {
            const deleteSendRequest = await UsersModel.findByIdAndUpdate(
                request.params.senderId,
                { $pull: { "sentRequests.pending": receiverId } },
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
            sender!.sentRequests.pending.push(receiverId);
            receiver!.receivedRequests.pending.push(new mongoose.Types.ObjectId(senderId));
            await sender!.save();
            await receiver!.save();
            response.send({
                sender: sender!.sentRequests.pending,
                receiver: receiver!.receivedRequests.pending,
                senderId: senderId,
                receiverId: receiverId,
            });
        }
    } catch (error) {
        next(error);
    }
});


usersRouter.post("/:userId/removeFollower", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const { followerId } = request.body
        const user = await UsersModel.findByIdAndUpdate(
            request.params.userId,
            { $pull: { followers: followerId } },
            { new: true, runValidators: true }
        );

        const follower = await UsersModel.findByIdAndUpdate(
            followerId,
            { $pull: { following: request.params.userId } },
            { new: true, runValidators: true }
        );

        response.send({ user, follower })
    } catch (error) {
        next(error)
    }
})

export default usersRouter;
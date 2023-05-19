import Express from "express";
import createHttpError from "http-errors";
import PostsModel from "./model";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import UsersModal from "../users/model";
import { Params } from "express-serve-static-core";
import { JWTAuthMiddleware } from "../../lib/auth/jwt";


const postsRouter = Express.Router();


postsRouter.post("/", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const newPost = new PostsModel(request.body);
        const { _id } = await newPost.save()
        response.status(201).send({ _id })

    } catch (error) {
        next(error);
    }
});


postsRouter.get("/", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const posts = await PostsModel.find()
            .populate([
                {
                    path: "user",
                    select: "username avatar",
                },
                {
                    path: "likes",
                    select: "username avatar",
                },
                {
                    path: "repost",
                    populate: {
                        path: "user",
                        select: "username avatar",
                    }
                }
            ]);
        response.send(posts);
    } catch (error) {
        next(error);
    }
});


postsRouter.get("/:postId", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const posts = await PostsModel.findById(request.params.postId).populate([
            {
                path: "user",
                select: "username avatar",
            },
            {
                path: "likes",
                select: "username avatar",
            },
        ]);

        if (posts) {
            response.send(posts);
        } else {
            next(
                createHttpError(404, `Post with id ${request.params.postId} not found!`)
            );
        }
    } catch (error) {
        next(error);
    }
});


postsRouter.put("/:postId", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const updatedPost = await PostsModel.findByIdAndUpdate(
            request.params.postId,
            request.body,
            { new: true, runValidators: true }
        );
        if (updatedPost) {
            response.send(updatedPost);
        } else {
            next(
                createHttpError(404, `Post with id ${request.params.postId} not found!`)
            );
        }
    } catch (error) {
        next(error);
    }
});


postsRouter.delete("/:postId", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const deletedPost = await PostsModel.findByIdAndDelete(request.params.postId);
        if (deletedPost) {
            response.status(204).send();
        } else {
            next(
                createHttpError(404, `Post with id ${request.params.postId} not found!`)
            );
        }
    } catch (error) {
        next(error);
    }
});


const cloudinaryPostImageUploader = multer({
    storage: new CloudinaryStorage({
        cloudinary,
        params: {
            folder: "Capstone/posts",
        } as Params,
    }),
}).single("postImage");

postsRouter.post("/image", JWTAuthMiddleware, cloudinaryPostImageUploader, async (request, response, next) => {
    try {
        const newPost = new PostsModel({ image: request.file!.path, text: request.body.text, user: request.body.user });
        const { _id } = await newPost.save();
        response.status(201).send({ _id });
    } catch (error) {
        next(error);
    }
}
);


const cloudinaryPostVideoUploader = multer({
    storage: new CloudinaryStorage({
        cloudinary,
        params: {
            folder: "Capstone/posts",
            resource_type: "video",
        } as Params,
    }),
}).single("postVideo");

postsRouter.post("/video", JWTAuthMiddleware, cloudinaryPostVideoUploader, async (request, response, next) => {
    try {
        const newPost = new PostsModel({ video: request.file!.path, text: request.body.text, user: request.body.user });
        const { _id } = await newPost.save();
        response.status(201).send({ _id });
    } catch (error) {
        next(error);
    }
}
);


postsRouter.get("/:postId/likes", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const post = await PostsModel.findById(request.params.postId).populate([
            {
                path: "user",
                select: "username avatar",
            },
            {
                path: "likes",
                select: "username avatar",
            },
        ]);
        if (post) {
            response.send(post.likes);
        } else {
            next(createHttpError(404, `Post with id ${request.params.postId} not found`));
        }
    } catch (error) {
        next(error);
    }
});

postsRouter.post("/:postId/like", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const { userId } = request.body;
        const post = await PostsModel.findById(request.params.postId);
        if (!post)
            return next(
                createHttpError(404, `Post with id ${request.params.postId} not found`)
            );
        const user = await UsersModal.findById(userId);
        if (!user)
            return next(createHttpError(404, `User with id ${userId} not found`));

        if (post.likes.includes(userId)) {
            const deleteLikes = await PostsModel.findOneAndUpdate(
                { _id: request.params.postId },
                { $pull: { likes: userId } },
                { new: true, runValidators: true }
            );
            response.send({
                deleteLikes,
                length: deleteLikes!.likes.length,
            });
        } else {
            const updatedPost = await PostsModel.findOneAndUpdate(
                { _id: request.params.postId },
                { $push: { likes: userId } },
                { new: true, runValidators: true, upsert: true }
            );
            response.send({
                updatedPost,
                length: updatedPost.likes.length,
            });
        }
    } catch (error) {
        next(error);
    }
});

export default postsRouter;
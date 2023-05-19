import Express from 'express'
import ChatsModel from './model'
import createHttpError from 'http-errors'
import { JWTAuthMiddleware } from '../../lib/auth/jwt'
import { Params } from "express-serve-static-core";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

const chatsRouter = Express.Router()

chatsRouter.get("/personalChats/:userId", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const userId = request.params.userId
        const chats = await ChatsModel.find({
            members: { $all: [userId] },
        }).populate(
            {
                path: "members",
                select: "username avatar"
            }
        );

        response.send(chats)

    } catch (error) {
        next(error)
    }
})


chatsRouter.get("/:chatId", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const chat = await ChatsModel.findById(request.params.chatId).populate([{
            path: "members",
            select: "username, avatar"
        },
        {
            path: "messages",
            populate: {
                path: "sender",
                select: "username avatar",
            }

        }])
        if (chat) {
            response.send(chat)
        } else {
            next(createHttpError(404, `Chat with id ${request.params.chatId} was not found!`))
        }
    } catch (error) {
        next(error)
    }
})


chatsRouter.post("/", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const { group, name } = request.body
        if (group.length === 2) {
            const chat = await ChatsModel.findOne({
                members: { $all: group, $size: 2 },
            });
            if (chat) {
                response.send(chat)
            } else {
                const newChat = new ChatsModel({
                    members: group,
                    messages: [],
                    name
                })
                const chat = await newChat.save()
                response.status(201).send(chat)
            }
        } else {
            const chat = await ChatsModel.findOne({
                members: { $all: group },
            });
            if (chat) {
                response.send(chat)
            } else {
                const newChat = new ChatsModel({
                    members: group,
                    messages: [],
                    name
                })
                const chat = await newChat.save()
                response.status(201).send(chat)
            }
        }
    } catch (error) {
        next(error)
    }
})



const cloudinaryMessageImageUploader = multer({
    storage: new CloudinaryStorage({
        cloudinary,
        params: {
            folder: "Capstone/messages",
        } as Params,
    }),
}).single("messageImage");

chatsRouter.post("/messages/image", JWTAuthMiddleware, cloudinaryMessageImageUploader, async (request, response, next) => {
    try {
        response.status(201).send({ imageUrl: request.file!.path });
    } catch (error) {
        next(error);
    }
}
);


const cloudinaryMessageVideoUploader = multer({
    storage: new CloudinaryStorage({
        cloudinary,
        params: {
            folder: "Capstone/messages",
            resource_type: "video",
        } as Params,
    }),
}).single("messageVideo");

chatsRouter.post("/messages/video", JWTAuthMiddleware, cloudinaryMessageVideoUploader, async (request, response, next) => {
    try {
        response.status(201).send({ videoUrl: request.file!.path });
    } catch (error) {
        next(error);
    }
}
);


export default chatsRouter
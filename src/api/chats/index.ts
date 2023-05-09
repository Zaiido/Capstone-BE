import Express from 'express'
import ChatsModel from './model'
import createHttpError from 'http-errors'

const chatsRouter = Express.Router()

chatsRouter.get("/", async (request, response, next) => {
    try {
        const { userId } = request.body
        const chats = await ChatsModel.find({
            members: { $all: [userId] },
        });

        response.send(chats)

    } catch (error) {
        next(error)
    }
})


chatsRouter.get("/:chatId", async (request, response, next) => {
    try {
        const chat = await ChatsModel.findById(request.params.chatId)
        if (chat) {
            response.send(chat)
        } else {
            next(createHttpError(404, `Chat with id ${request.params.chatId} was not found!`))
        }
    } catch (error) {
        next(error)
    }
})


chatsRouter.post("/", async (request, response, next) => {
    try {
        const { group } = request.body
        if (group.length === 2) {
            const chat = await ChatsModel.findOne({
                members: { $all: group, $size: 2 },
            });
            if (chat) {
                response.send(chat)
            } else {
                const newChat = new ChatsModel({
                    members: group,
                    messages: []
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
                    messages: []
                })
                const chat = await newChat.save()
                response.status(201).send(chat)
            }
        }
    } catch (error) {
        next(error)
    }
})


export default chatsRouter
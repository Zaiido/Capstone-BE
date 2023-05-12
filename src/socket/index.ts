import { Socket } from "socket.io";
import ChatModel from "../api/chats/model";
import { ISocketUser } from "../interfaces/ISocketUser";
import mongoose from "mongoose";

let onlineUsers = <ISocketUser[]>[];
let roomName: string;

export const connectionHandler = (socket: Socket) => {

    socket.on("joinRoom", (room) => {
        socket.join(room);
        roomName = room
        socket.emit("roomName", room)
    });

    socket.on("sendMessage", async (message) => {
        let newMessage = {
            manualId: message.message.manualId,
            sender: new mongoose.Types.ObjectId(message.message.sender),
            text: message.message.text,
            video: message.message.video,
            image: message.message.image,
            createdAt: message.message.createdAt,
        };
        let chat = await ChatModel.findByIdAndUpdate(
            roomName,
            { $push: { messages: newMessage } },
            { new: true, runValidators: true }
        ).populate({
            path: "messages",
            populate: {
                path: "sender",
                select: "username avatar",
            }
        });
        let addedMessage = chat!.messages.find((msg) => msg.manualId === message.message.manualId);
        socket.to(roomName).emit("newMessage", addedMessage);

    });

    socket.on("disconnect", () => {
        onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
        socket.broadcast.emit("updateOnlineUsersList", onlineUsers);
    });
};
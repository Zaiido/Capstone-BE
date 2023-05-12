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
        socket.to(roomName).emit("newMessage", message);
        let newMessage = {
            sender: new mongoose.Types.ObjectId(message.message.sender),
            text: message.message.text,
            createdAt: message.message.createdAt
        };
        await ChatModel.findByIdAndUpdate(
            roomName,
            { $push: { messages: newMessage } },
            { new: true, runValidators: true }
        );

    });

    socket.on("disconnect", () => {
        onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
        socket.broadcast.emit("updateOnlineUsersList", onlineUsers);
    });
};
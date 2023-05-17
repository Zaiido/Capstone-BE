import Express from "express";
import { createServer } from "http";
import cors from "cors";
import { badRequestHandler, forbiddenHandler, genericErrorHandler, notFoundHandler, unauthorizedHandler } from "./errorHandlers";
import usersRouter from "./api/users";
import passport from "passport";
import googleStrategy from "./lib/auth/googleOAuth";
import facebookStrategy from "./lib/auth/facebookOAuth";
import postsRouter from "./api/posts";
import commentsRouter from "./api/comments";
import chatsRouter from "./api/chats";
import { Server } from "socket.io"
import { connectionHandler } from "./socket";
import gardenRouter from "./api/garden";
import deadPlantsRouter from "./api/deadPlants";

const expressServer = Express();

// SOCKET.IO & PASSPORT
const httpServer = createServer(expressServer);
passport.use("google", googleStrategy);
passport.use("facebook", facebookStrategy);
const socketServer = new Server(httpServer)
socketServer.on("connection", connectionHandler)

//MIDDLEWARES
expressServer.use(cors());
expressServer.use(Express.json());
expressServer.use(passport.initialize());

//ENDPOINTS

expressServer.use("/users", usersRouter)
expressServer.use("/posts", postsRouter)
expressServer.use("/posts", commentsRouter)
expressServer.use("/chats", chatsRouter)
expressServer.use("/garden", gardenRouter)
expressServer.use("/garden", deadPlantsRouter)

//ERROR HANDLERS
expressServer.use(badRequestHandler);
expressServer.use(unauthorizedHandler);
expressServer.use(forbiddenHandler);
expressServer.use(notFoundHandler);
expressServer.use(genericErrorHandler);

export { httpServer, expressServer };

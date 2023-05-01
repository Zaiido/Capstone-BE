import Express from "express";
import { createServer } from "http";
import cors from "cors";
import { badRequestHandler, forbiddenHandler, genericErrorHandler, notFoundHandler, unauthorizedHandler } from "./errorHandlers";
import usersRouter from "./api/users";
import passport from "passport";
import googleStrategy from "./lib/auth/googleOAuth";
import facebookStrategy from "./lib/auth/facebookOAuth";

const expressServer = Express();

// SOCKET.IO
const httpServer = createServer(expressServer);
passport.use("google", googleStrategy);
passport.use("facebook", facebookStrategy);

//MIDDLEWARES
expressServer.use(cors());
expressServer.use(Express.json());
expressServer.use(passport.initialize());

//ENDPOINTS

expressServer.use("/users", usersRouter)

//ERROR HANDLERS
expressServer.use(badRequestHandler);
expressServer.use(unauthorizedHandler);
expressServer.use(forbiddenHandler);
expressServer.use(notFoundHandler);
expressServer.use(genericErrorHandler);

export { httpServer, expressServer };

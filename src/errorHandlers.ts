import mongoose from "mongoose";
import { ErrorRequestHandler } from "express";
import { IValidationError } from "./interfaces/IValidationError";


export const badRequestHandler: ErrorRequestHandler = (error, request, response, next) => {
    if (error.status === 400 || error instanceof mongoose.Error.ValidationError) {
        if (error.errorsList) {
            response.status(400).send({ message: error.message, errorsList: error.errorsList.map((e: IValidationError) => e.msg) })

        } else {
            response.status(400).send({ message: error.message })
        }
    } else {
        next(error);
    }
};

export const unauthorizedHandler: ErrorRequestHandler = (error, request, response, next) => {
    if (error.status === 401) {
        response.status(401).send({ message: error.message });
    } else {
        next(error);
    }
};

export const forbiddenHandler: ErrorRequestHandler = (error, request, response, next) => {
    if (error.status === 403) {
        response.status(403).send({ message: error.message });
    } else {
        next(error);
    }
};

export const notFoundHandler: ErrorRequestHandler = (error, request, response, next) => {
    if (error.status === 404) {
        response.status(404).send({ message: error.message });
    } else {
        next(error);
    }
};

export const genericErrorHandler: ErrorRequestHandler = (error, request, response, next) => {
    console.log(error);
    response.status(500).send({ message: "We gonna fix this ASAP!" });
};
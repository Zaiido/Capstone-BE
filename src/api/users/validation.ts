import createHttpError from "http-errors";
import { RequestHandler } from "express";
import { checkSchema, Schema, Location, validationResult, } from "express-validator";

const userSchema: Schema<"isString" | "in"> = {
    username: {
        in: "body" as Location,
        isString: {
            errorMessage: "Name is a mandatory field and needs to be a string!",
        },
    },
    email: {
        in: "body" as Location,
        isString: {
            errorMessage: "Email is a mandatory field and needs to be a string!",
        },
    },
    password: {
        in: "body" as Location,
        isString: {
            errorMessage: "Password is a mandatory field and needs to be a string!",
        },
    }
};

export const checkUserSchema = checkSchema(userSchema);

export const generateBadRequest: RequestHandler = (request, response, next) => {
    const errors = validationResult(request);
    if (errors.isEmpty()) {
        next();
    } else {
        next(
            createHttpError(400, "Errors during user validation", {
                errorsList: errors.array(),
            })
        );
    }
};
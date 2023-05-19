import Express from 'express'
import GardenModel from './model'
import createHttpError from 'http-errors';
import { Params } from "express-serve-static-core";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import fetch from 'node-fetch';
import { JWTAuthMiddleware } from '../../lib/auth/jwt';


const gardenRouter = Express.Router()

gardenRouter.post("/", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const newPlant = new GardenModel(request.body);
        const { _id } = await newPlant.save()
        response.status(201).send({ _id })

    } catch (error) {
        next(error);
    }
});


gardenRouter.get("/:userId", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const plants = await GardenModel.find({ owner: request.params.userId });
        response.send(plants);
    }
    catch (error) {
        next(error)
    }
})


gardenRouter.put("/:plantId", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const updatedPlant = await GardenModel.findByIdAndUpdate(
            request.params.plantId,
            request.body,
            { new: true, runValidators: true }
        );
        if (updatedPlant) {
            response.send(updatedPlant);
        } else {
            next(
                createHttpError(404, `Plant with id ${request.params.plantId} not found!`)
            );
        }
    } catch (error) {
        next(error);
    }
});


const cloudinaryPlantImageUpdateUploader = multer({
    storage: new CloudinaryStorage({
        cloudinary,
        params: {
            folder: "Capstone/garden",
        } as Params,
    }),
}).single("editPlantImage");

gardenRouter.post("/editImage", JWTAuthMiddleware, cloudinaryPlantImageUpdateUploader, async (request, response, next) => {
    try {
        const imageUrl = request.file!.path
        if (imageUrl) {
            response.send({ imageUrl });
        }
    } catch (error) {
        next(error);
    }
}
);


gardenRouter.delete("/:plantId", JWTAuthMiddleware, async (request, response, next) => {
    try {
        const deletedPlant = await GardenModel.findByIdAndDelete(request.params.plantId);
        if (deletedPlant) {
            response.status(204).send();
        } else {
            next(
                createHttpError(404, `Plant with id ${request.params.plantId} not found!`)
            );
        }
    } catch (error) {
        next(error);
    }
});


const cloudinaryPlantImageUploader = multer({
    storage: new CloudinaryStorage({
        cloudinary,
        params: {
            folder: "Capstone/garden",
        } as Params,
    }),
}).single("plantImage");

gardenRouter.post("/identify", JWTAuthMiddleware, cloudinaryPlantImageUploader, async (request, response, next) => {
    try {
        const imageUrl = request.file!.path
        if (imageUrl) {
            let identificationRes = await fetch(`${process.env.PLANT_API_URL}images=${imageUrl}&include-related-images=true&no-reject=false&lang=en&api-key=${process.env.PLANT_API_KEY}`)
            if (identificationRes.ok) {
                let data = await identificationRes.json()
                response.send({ data, imageUrl });
            }
        }
    } catch (error) {
        next(error);
    }
}
);


export default gardenRouter
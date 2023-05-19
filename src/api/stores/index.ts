import Express from "express";
import StoresModel from './model'

const storesRouter = Express.Router()

storesRouter.get("/", async (request, response, next) => {
    try {
        const stores = await StoresModel.find()
        if (stores) {
            response.send(stores)
        }
    } catch (error) {
        next(error)
    }
})


storesRouter.post("/", async (request, response, next) => {
    try {
        const newStore = new StoresModel(request.body);
        const { _id } = await newStore.save()
        response.status(201).send({ _id })
    } catch (error) {
        next(error);
    }
});


export default storesRouter
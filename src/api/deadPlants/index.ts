import Express from "express";
import DeadPlantsModel from './model'

const deadPlantsRouter = Express.Router()

deadPlantsRouter.get("/deadPlants/:userId", async (request, response, next) => {
    try {
        const deadPlantsNumber = await DeadPlantsModel.findOne({ owner: request.params.userId })
        if (deadPlantsNumber) {
            response.send({ deadPlants: deadPlantsNumber.deadPlants })
        } else {
            response.send({ deadPlants: 0 })
        }
    } catch (error) {
        next(error)
    }
})


deadPlantsRouter.post("/deadPlants/:userId", async (request, response, next) => {
    try {
        const { userId } = request.params;

        const existingDeadPlants = await DeadPlantsModel.findOneAndUpdate(
            { owner: userId },
            { $inc: { deadPlants: 1 } },
            { new: true, upsert: true, runValidators: true }
        );

        response.status(200).send({ deadPlants: existingDeadPlants.deadPlants });
    } catch (error) {
        next(error);
    }
});




export default deadPlantsRouter
import { Hono, Context, Next } from "hono";
import { PetModel } from "../models/petModel";
import { EnvironmentFV } from "../network/environmentFV";
import { PetFV } from "../network/petFV";
import { ActivityFV } from "../network/activityFV";
import { UserFV } from "../network/userFV";
import { ActivityModel } from "../models/activityModel";

export function createPetRoutes(pets : Map<string, PetModel>) {
    type AppEnv = {
        Variables: {
            pet: PetModel
        }
    }
    const router = new Hono<AppEnv>()

    const petMiddleWare = async (c : Context, next : Next) => {
        const petID = c.req.param("petID");
        if (!petID) {
            return c.json({error: "petID is required"}, 400);
        }

        const pet = pets.get(petID);
        if (!pet) {
            return c.json({error: "Pet not found"}, 404);
        }

        c.set("pet", pet);
        await next();
    };

    // returns all pets' views 
    // () -> (allPetViews)
    router.get("/", (c) => {
        return c.json({
            allPetViews : Array.from(pets.values()).map(pet => pet.getView())
        })
    })

    router.use("/:petID/*", petMiddleWare)

    // return pet's view
    // () -> (petView)
    router.get("/:petID", petMiddleWare, (c) => {
        return c.json({
            petView: (c.get("pet") as PetModel).getView()
        })
    })

    // set pet's environment, makes sure environment also contains pet
    // (environmentFV) -> (accepted, message)
    router.post("/:petID/set-environment", async (c) => {
        const pet = c.get("pet") as PetModel;
        const body = await c.req.json();

        const environmentFV = new EnvironmentFV(body.environmentFV.id, body.environmentFV.serverURL);
        const response = await pet.setEnvironment(environmentFV);

        return c.json({
            accepted: response.accepted,
            message: response.message
        })
    })

    // request pet to do activity with partner
    // (activityFV, partnerFV) -> (accepted, message)
    router.post("/:petID/activity-request", async (c) => {
        const pet = c.get("pet") as PetModel;
        const body = await c.req.json();

        const activityFV = new ActivityFV(body.activityFV.id, body.activityFV.serverURL);
        const activityModel = await ActivityModel.fromFV(activityFV);
        if (!activityModel) {
            return c.json({
                accepted: false,
                message: "Activity not found"
            })
        }

        const partnerType = body.partnerFV.type;

        var partnerFV : PetFV | UserFV | undefined = undefined;
        if (partnerType === "pet") {
            partnerFV = new PetFV(body.partnerFV.id, body.partnerFV.serverURL);
        } else if (partnerType === "user") {
            partnerFV = new UserFV(body.partnerFV.id, body.partnerFV.serverURL);
        }

        if (!partnerFV) {
            return c.json({
                accepted: false,
                message: "Invalid partner type"
            })
        }

        // HACK: this assumes the other pet starts the activity
        // TODO this pet can have a timeout for activity to start
        const response = await pet.recieveActivityRequest(activityModel, partnerFV);

        return c.json({
            accepted: response.accepted,
            message: response.message
        })
    })

    // make the pet tick if it is doing this activity
    // (activityFV) -> (accepted, message)
    router.post("/:petID/activity-tick", async (c) => {
        const pet = c.get("pet") as PetModel;
        const body = await c.req.json();

        if (!body.activityFV || !body.activityFV.id || !body.activityFV.serverURL) {
            return c.json({
                accepted: false,
                message: "activityFV with id and serverURL is required"
            })
        }
        const activityFV = new ActivityFV(body.activityFV.id, body.activityFV.serverURL);

        const {accepted, message} = pet.processActivityTick(activityFV);

        return c.json({
            accepted: accepted,
            message: message
        })
    })

    // tell the pet that the activity is finished, so it can go back to idle
    // (activityFV) -> (accepted, message)
    router.post("/:petID/activity-finished", async (c) => {
        const pet = c.get("pet") as PetModel;
        const body = await c.req.json();

        if (!body.activityFV || !body.activityFV.id || !body.activityFV.serverURL) {
            return c.json({
                accepted: false,
                message: "activityFV with id and serverURL is required"
            })
        }
        const activityFV = new ActivityFV(body.activityFV.id, body.activityFV.serverURL);

        const {accepted, message} = pet.activityFinished(activityFV);

        return c.json({
            accepted: accepted,
            message: message
        })
    })

    return router
}
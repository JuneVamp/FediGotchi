import { Hono } from "hono";
import { PetModel } from "../models/petModel";

export function createPetRoutes(pets : Map<string, PetModel>) {
    const router = new Hono()

    // returns all pets' views 
    // () -> (allPetViews)
    router.get("/", (c) => {
        return c.json(
            "NOTHING"
        )
    })

    // return pet's view
    // () -> (petView)
    router.get("/:petID", (c) => {
        return c.json(
            "NOTHING"
        )
    })

    // set pet's environment, makes sure environment also contains pet
    // (environmentFV) -> (accepted, message)
    router.post("/:petID/set-environment", (c) => {
        return c.json(
            "NOTHING"
        )
    })

    // request pet to do activity with partner
    // (activityFV, partnerFV) -> (accepted, message)
    router.post("/:petID/activity-request", (c) => {
        return c.json(
            "NOTHING"
        )
    })

    // make the pet tick if it is doing this activity
    // (activityFV) -> (accepted, message)
    router.post("/:petID/activity-tick", (c) => {
        return c.json(
            "NOTHING"
        )
    })

    // tell the pet that the activity is finished, so it can go back to idle
    // (activityFV) -> (accepted, message)
    router.post("/:petID/activity-finished", (c) => {
        return c.json(
            "NOTHING"
        )
    })

    return router
}
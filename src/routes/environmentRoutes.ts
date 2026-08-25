import { Hono } from "hono";
import { EnvironmentModel } from "../models/environmentModel";

export function createEnvironmentRoutes(environments : Map<string, EnvironmentModel>) {
    const router = new Hono()

    // returns all environments' views
    // () -> (allEnvironmentViews)
    router.get("/", (c) => {
        return c.json(
            "NOTHING"
        )
    })

    // return environment's view
    // () -> (environmentView)
    router.get("/:environmentID", (c) => {
        return c.json(
            "NOTHING"
        )
    })

    // add pet to environment, makes sure pet also contains environment
    // (petFV) -> (accepted, message)
    router.post("/:environmentID/add-pet", (c) => {
        return c.json(
            "NOTHING"
        )
    })

    // NOTE: should only be called if pet has been moved to another environment, or if pet has been deleted
    // remove pet from environment
    // (petFV) -> (accepted, message)
    router.post("/:environmentID/remove-pet", (c) => {
        return c.json(
            "NOTHING"
        )
    })

    // get all pets in an environment
    // () -> (petViews)
    router.get("/:environmentID/pets", (c) => {
        return c.json(
            "NOTHING"
        )
    })


    // get all items in an environment
    // () -> (itemViews)
    router.get("/:environmentID/items", (c) => {
        return c.json(
            "NOTHING"
        )
    })

    return router
}

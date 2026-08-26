import { Hono } from "hono"
import { ActivityModel } from "../models/activityModel"

export function createActivityRoutes(activities : Map<string, ActivityModel>) {
    const router = new Hono()

    // returns nothing
    // () -> (message)
    router.get("/", (c) => {
        return c.json({
            message: "This returns nothing to reduce amount of data transfered, try /activity/:activityID instead"
        })
    })

    // returns activity's view
    // () -> (activityView)
    router.get("/:activityID", (c) => {
        return c.json({
            message: "NOTHING"
        })
    })

    // create new activity
    // (activityName) -> (accepted, message)
    router.post("/create", (c) => {
        return c.json({
            message: "NOTHING"
        })
    })

    // add pet to activity
    // (petFV) -> (accepted, message)
    router.post("/:activityID/add-pet" , (c) => {
        return c.json({
            message: "NOTHING"
        })
    })

    // add user to activity
    // (userFV) -> (accepted, message)
    router.post("/:activityID/add-user" , (c) => {
        return c.json({
            message: "NOTHING"
        })
    })

    // start activity
    // () -> (accepted, message)
    router.post("/:activityID/start" , (c) => {
        return c.json({
            message: "NOTHING"
        })
    })

    return router
}
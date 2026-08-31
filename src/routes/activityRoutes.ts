import { Hono, Context, Next } from "hono"
import { ActivityModel } from "../models/activityModel"
import { ActivityFV } from "../network/activityFV"
import { PetFV } from "../network/petFV"
import { UserFV } from "../network/userFV"

export function createActivityRoutes(activities : Map<string, ActivityModel>) {

    type AppEnv = {
        Variables: {
            activity: ActivityModel
        }
    }

    const router = new Hono<AppEnv>()

    const activityMiddleware = async (c : Context, next : Next) => {
        const activityID = c.req.param("activityID");
        if (!activityID) {
            return c.json({error: "activityID is required"}, 400);
        }

        const activity = activities.get(activityID);
        if (!activity) {
            return c.json({error: "Activity not found"}, 404);
        }

        c.set("activity", activity);
        await next();
    }

    // HACK DO NOT USE THIS globally (it messes up the create)
    // router.use("/:activityID/*", activityMiddleware)

    // returns nothing
    // () -> (accepted, message)
    router.get("/", (c) => {
        return c.json({
            accepted: false,
            message: "This returns nothing to reduce amount of data transfered, try /activities/:activityID instead",
            allActiveActivitiesViews : Array.from(activities.values()).map(activity => activity.getView())
        })
    })

    // returns activity's view
    // () -> (accepted, message, activityView)
    router.get("/:activityID", activityMiddleware, (c) => {
        const activity = c.get("activity") as ActivityModel;
        const activityView = activity.getView();
        return c.json({
            accepted: true,
            message: "Activity view retrieved successfully",
            activityView : activityView
        })
    })

    // create new activity
    // (activityName, activityFV) -> (accepted, message)
    router.post("/:activityID/create", async (c) => {
        const body = await c.req.json();

        const activityName = body.activityName;
        if (!activityName) {
            return c.json({
                accepted: false,
                message: "activityName is required"
            })
        }

        var activity = ActivityModel.fromStringData(activityName);
        if (!activity) {
            return c.json({
                accepted: false,
                message: `Activity ${activityName} not found in data.json`
            })
        }

        if (!body.activityFV || !body.activityFV.id || !body.activityFV.serverURL) {
            return c.json({
                accepted: false,
                message: "activityFV with id and serverURL is required" + (JSON.stringify(body.activityFV))
            })
        }
        activity.FV = new ActivityFV(body.activityFV.id, body.activityFV.serverURL, activityName);


        activities.set(body.activityFV.id, activity);

        return c.json({
            accepted: true,
            message: `Activity ${activityName} created with ID ${body.activityFV.id}`
        })
    })

    // delete activity
    // () -> (accepted, message)
    router.post("/:activityID/delete", activityMiddleware, async (c) => {
        const activity = c.get("activity") as ActivityModel;
        activities.delete(activity.FV?.id || "");
        return c.json({
            accepted: true,
            message: `Activity ${activity.name} deleted`
        })
    })

    // add pet to activity
    // (petFV) -> (accepted, message)
    router.post("/:activityID/add-pet" , activityMiddleware, async (c) => {
        const activity = c.get("activity") as ActivityModel;
        const body = await c.req.json();

        if (!body.petFV || !body.petFV.id || !body.petFV.serverURL) {
            return c.json({
                accepted: false,
                message: "petFV with id and serverURL is required"
            })
        }
        activity.addPet(new PetFV(body.petFV.id, body.petFV.serverURL))

        return c.json({
            accepted: true,
            message: `Pet ${body.petFV.id} added to activity ${activity.name}`
        })
    })

    // add user to activity
    // (userFV) -> (accepted, message)
    router.post("/:activityID/add-user" , activityMiddleware, async (c) => {
        const activity = c.get("activity") as ActivityModel;
        const body = await c.req.json();

        if (!body.userFV || !body.userFV.id || !body.userFV.serverURL) {
            return c.json({
                accepted: false,
                message: "userFV with id and serverURL is required"
            })
        }
        activity.addUser(new UserFV(body.userFV.id, body.userFV.serverURL))

        return c.json({
            accepted: true,
            message: `User ${body.userFV.id} added to activity ${activity.name}`
        })
    })

    // start activity
    // () -> (accepted, message)
    router.post("/:activityID/start" , activityMiddleware, async (c) => {
        const activity = c.get("activity") as ActivityModel;
        activity.start()

        const activityID = c.req.param("activityID");
        if (!activityID) {
            return c.json({
                accepted: false,
                message: "activityID is required"
            })
        }

        // assuming the main sim on the server runs the activities in the activity map
        activity.finishedCallbacks.push(() => {
            activities.delete(activityID);
        })

        return c.json({
            accepted: true,
            message: `Activity ${activity.name} started`
        })
    })

    return router
}
import { Hono, Context, Next } from "hono";
import { EnvironmentModel } from "../models/environmentModel";
import { PetFV } from "../network/petFV";

export function createEnvironmentRoutes(environments : Map<string, EnvironmentModel>) {
    type AppEnv = {
        Variables: {
            environment: EnvironmentModel
        }
    }
    const router = new Hono<AppEnv>()

    const environmentMiddleware = async (c : Context, next : Next) => {
        const environmentID = c.req.param("environmentID");
        if (!environmentID) {
            return c.json({error: "environmentID is required"}, 400);
        }

        const environment = environments.get(environmentID);
        if (!environment) {
            return c.json({error: "Environment not found"}, 404);
        }

        c.set("environment", environment);
        await next();
    }

    router.use("/:environmentID/*", environmentMiddleware)

    // returns all environments' views
    // () -> (allEnvironmentViews)
    router.get("/", (c) => {
        return c.json({
            allEnvironmentViews : Array.from(environments.values()).map(environment => environment.getView())
        })
    })

    // return environment's view
    // () -> (environmentView)
    router.get("/:environmentID", environmentMiddleware, (c) => {
        return c.json({
            environmentView: (c.get("environment") as EnvironmentModel).getView()
        })
    })

    // add pet to environment, makes sure pet also contains environment
    // (petFV) -> (accepted, message)
    router.post("/:environmentID/add-pet", async (c) => {
        const environment = c.get("environment") as EnvironmentModel;
        const body = await c.req.json();

        if (!body.petFV || !body.petFV.id || !body.petFV.serverURL) {
            return c.json({
                accepted: false,
                message: "petFV with id and serverURL is required"
            })
        }
        environment.addPet(new PetFV(body.petFV.id, body.petFV.serverURL))

        return c.json({
            accepted: true,
            message: `Pet ${body.petFV.id} added to environment ${environment.name}`
        })
    })

    // NOTE: should only be called if pet has been moved to another environment, or if pet has been deleted
    // remove pet from environment
    // (petFV) -> (accepted, message)
    router.post("/:environmentID/remove-pet", async (c) => {
        const environment = c.get("environment") as EnvironmentModel;
        const body = await c.req.json();

        if (!body.petFV || !body.petFV.id || !body.petFV.serverURL) {
            return c.json({
                accepted: false,
                message: "petFV with id and serverURL is required"
            })
        }
        environment.removePet(new PetFV(body.petFV.id, body.petFV.serverURL))

        return c.json({
            accepted: true,
            message: `Pet ${body.petFV.id} removed from environment ${environment.name}`
        })
    })

    // get all pets in an environment
    // () -> (petsFV)
    router.get("/:environmentID/pets", (c) => {
        const environment = c.get("environment") as EnvironmentModel;

        return c.json({
            petsFV: environment.getAllPetsFV()
        })
    })


    // get all items in an environment
    // () -> (itemViews)
    router.get("/:environmentID/items", (c) => {
        const environment = c.get("environment") as EnvironmentModel;

        return c.json({
            itemViews: environment.items.map(item => item.getView())
        })
    })

    return router
}

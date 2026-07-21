import {Context, Hono, Next} from "hono"
import {
        htmlLayoutString,
        petViewLayoutString,
        petActivityHistoryHtmlString,
        petViewHtmlString,
    } from "../htmlStrings"

const app = new Hono()


// TODO 10 someday to clean up

// const petMiddleware = async (c: Context, next: Next) => {
//   const petName = c.req.param("petId")!.toLowerCase()
//   const pet = pets.get(petName)

//   if (!pet) {
//     return c.json({ message: `Pet ${petName} not found` }, 404)
//   }

//   c.set("pet", pet)
//   await next()
// }
// app.use("/pets/:petId/*", petMiddleware)

// app.get("/pets/:petId", petMiddleware, async (c) => {
//   const pet = c.get("pet") as VPet
//   const petView = pet.getView()

//   const accept = c.req.header("Content-Type") ?? ""
//   const isJson = accept.includes("application/json")

//   if (!isJson) {
//     return c.html(
//       htmlLayoutString(
//         [
//           petViewLayoutString(petView, c.get("baseUrl"), [
//             petViewHtmlString(petView, c.get("baseUrl")),
//             petActivityHistoryHtmlString()
//           ])
//         ],
//         c.get("baseUrl"))
//     )
//   }


//   return c.json({
//     pet: pet.getView()
//   })
// })

// app.post("/pets/:petId/activity-request", async (c) => {
//   const pet = c.get("pet")
//   const body = await c.req.json()
//   const activity = VPActivity.fromJson(body.activity)
//   const activityPartnerType = body.activityPartnerType

//   var activityPartner : VPetRemoteRef | VPUserRemoteRef | undefined = undefined
//   if (activityPartnerType === "pet") {
//     activityPartner = new VPetRemoteRef(body.activityPartnerId, body.activityPartnerServerUrl)
//   } else if (activityPartnerType === "user") {
//     activityPartner = new VPUserRemoteRef(body.activityPartnerId, body.activityPartnerServerUrl)
//   } else {
//     return c.json({
//       message: `Activity partner type ${activityPartnerType} not supported`
//     }, 400)
//   }

//   const accepted = await pet.receiveActivityRequest(activity, activityPartner);
//   return c.json({
//     accepted: accepted
//   });

// })

// app.post("/pets/:petId/set-environment", async (c) => {
//   const pet = c.get("pet")
//   const body = await c.req.json()
//   pet.environment = new VPEnvironmentRemoteRef(body.environmentId, body.environmentServerUrl)
//   return c.json({
//     message: `Pet ${pet.name} set to environment ${body.environmentId}`
//   })
// })


export default app
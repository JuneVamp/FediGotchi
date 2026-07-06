import { VPItem, VPEnvironment, VPUser } from "./otherModels"
import { VPet } from "./pet"
import {Context, Hono, Next} from "hono"
import { Layout, PetListComponent } from "./views"
import { serveStatic } from "@hono/node-server/serve-static"
import { capitalizeFirstLetter } from "./utils"
import { SERVER_URL } from "./serverConfig.ts"
import { VPEnvironmentRemoteRef, VPetRemoteRef, VPUserRemoteRef } from "./remoteRefs.ts"
import { VPActivity } from "./petRepresentation.ts"

type AppEnv = {
  Variables : {
    pet : VPet
  }
}

const app = new Hono<AppEnv>()
app.get("/assets/*", serveStatic({root : './'}))

var users = new Map<string, VPUser>()
var pets = new Map<string, VPet>()
var environments = new Map<string, VPEnvironment>()

var user1 = new VPUser("userJune")
users.set(user1.name, user1)
  
var pet1 = new VPet("Alice", SERVER_URL)
var pet2 = new VPet("Brice", SERVER_URL)
var pet3 = new VPet("Cami", SERVER_URL)
var pet4 = new VPet("Dani", SERVER_URL)

pets.set(pet1.name.toLowerCase(), pet1)
pets.set(pet2.name.toLowerCase(), pet2)
pets.set(pet3.name.toLowerCase(), pet3)
pets.set(pet4.name.toLowerCase(), pet4)

var homeEvironment = VPEnvironment.fromStringData("Home") 
var parkEnvironment = VPEnvironment.fromStringData("Park")
var schoolEnvironment = VPEnvironment.fromStringData("School")

environments.set(homeEvironment.name.toLowerCase(), homeEvironment)
environments.set(parkEnvironment.name.toLowerCase(), parkEnvironment)
environments.set(schoolEnvironment.name.toLowerCase(), schoolEnvironment)

// const remoteServerUrl = "https://conclave.cs.tsukuba.ac.jp/fediflock/"

// const remotePark = new VPEnvironmentRemoteRef("Park", remoteServerUrl, "Remote Park")

// remotePark.addPet(pet1.getRemoteRef())
// remotePark.addPet(pet2.getRemoteRef())
parkEnvironment.addPet(pet1.getRemoteRef())
parkEnvironment.addPet(pet2.getRemoteRef())
parkEnvironment.addPet(pet3.getRemoteRef())
parkEnvironment.addPet(pet4.getRemoteRef())


pet1.tick()
pet2.tick()
pet3.tick()
pet4.tick()

setInterval(() => {
  pet1.tick()
  pet2.tick()
  pet3.tick()
  pet4.tick()

}, 1000)


app.get("/federation/me", async (c) => {
  return c.json({
    serverUrl: new URL(c.req.url).origin
  })
})

app.get("/api/pets", async (c) => {
  return c.json({
    pets: Array.from(pets.values()).map(pet => { return pet.getView(); })
  })
})


// --------- pets -------

const petMiddleware = async (c: Context, next: Next) => {
  const petName = c.req.param("petId")!.toLowerCase().toLowerCase().toLowerCase().toLowerCase()
  const pet = pets.get(petName)

  if (!pet) {
    return c.json({ message: `Pet ${petName} not found` }, 404)
  }

  c.set("pet", pet)
  await next()
}
app.use("/pets/:petId/*", petMiddleware)

app.get("/pets/:petId", petMiddleware, async (c) => {
  const pet = c.get("pet") as VPet
  return c.json({
    pet: pet.tempPetView
  })
})


app.post("/pets/:petId/activity-request", async (c) => {
  const pet = c.get("pet")
  const body = await c.req.json()
  const activity = VPActivity.fromJson(body.activity)
  const activityPartnerType = body.activityPartnerType

  var activityPartner : VPetRemoteRef | VPUserRemoteRef | undefined = undefined
  if (activityPartnerType === "pet") {
    activityPartner = new VPetRemoteRef(body.activityPartnerId, body.activityPartnerServerUrl)
  } else if (activityPartnerType === "user") {
    activityPartner = new VPUserRemoteRef(body.activityPartnerId, body.activityPartnerServerUrl)
  } else {
    return c.json({
      message: `Activity partner type ${activityPartnerType} not supported`
    }, 400)
  }

  const accepted = await pet.receiveActivityRequest(activity, activityPartner);
  return c.json({
    accepted: accepted
  });

})

app.post("/pets/:petId/set-environment", async (c) => {
  const pet = c.get("pet")
  const body = await c.req.json()
  pet.environment = new VPEnvironmentRemoteRef(body.environmentId, body.environmentServerUrl)
  return c.json({
    message: `Pet ${pet.name} set to environment ${body.environmentId}`
  })
})

// --------- environments -------
app.get("/environments/:environmentId", async (c) => {
  const environmentId = c.req.param("environmentId")!
  const environment = environments.get(capitalizeFirstLetter(environmentId))
  if (!environment) {
    return c.json({
      message: `Environment ${environmentId} not found`
    }, 404)
  }
  return c.json({
    environement: environment.getRemoteRef()
  })
})

app.get("/environments/:environmentId/pets", async (c) => {
  const environmentId = c.req.param("environmentId")!
  const environment = environments.get(environmentId.toLowerCase())
  if (!environment) {
    return c.json({
      message: `Environment ${environmentId} not found`
    }, 404)
  }

  const allPets = environment.getAllPets()
  return c.json({
    pets: allPets
  })
})

app.get("/environments/:environmentId/items", async (c) => {
  const environmentId = c.req.param("environmentId")!
  const environment = environments.get(environmentId.toLowerCase())
  if (!environment) {
    return c.json({
      message: `Environment ${environmentId} not found`
    }, 404)
  }

  const allItems = environment.items
  return c.json({
    items: allItems.map(item => {
      return {
        name: item.name,
        activity: item.activity ? item.activity.toJson() : undefined
      }
    })
  })
})

app.post("/environments/:environmentId/add-pet", async (c) => {
  const environmentId = c.req.param("environmentId")!
  const environment = environments.get(environmentId.toLowerCase())
  if (!environment) {
    return c.json({
      message: `Environment ${environmentId} not found`
    }, 404)
  }
  
  const body = await c.req.json()
  const pet = new VPetRemoteRef(body.petId, body.petServerUrl)
  environment.addPet(pet)
  return c.json({
    message: `Pet ${body.petId} added to environment ${environmentId}`
  })
})

// --------- users ----------
app.get("/users/:userId", async (c) => {
  // TODO 1
})

// app.post("/api/pets/:pet/post", async (c) => {
//   const body = await c.req.json()
//   const petName = capitalizeFirstLetter(c.req.param("pet"))
//   const userName = body.userName
//   var returnMessage = ""

//   const postType = body.postType
//   switch (postType) {
//     case "UserPetActivity":
//       const activityName = capitalizeFirstLetter(body.activityName)
//       const pet = pets.get(petName)
//       const user = users.get(userName)

//       if (!user){
//         return c.json({
//           message: `User ${userName} not found`
//         }, 404)
//       }

//       user.askPetToDoActivity(pet!, activityName).then((accepted : boolean) => {
//         if (accepted) {
//           returnMessage = `Activity request accepted for ${petName}`
//         } else {
//           returnMessage = `Activity request rejected for ${petName}`
//         }
//       })

//     case undefined:
//       returnMessage = "No postType provided"
//       break
//   }

//   return c.json({
//     message: returnMessage
//   })

// })

// app.post("/api/pets/:petName/activities/:activityName", async (c) => {

//   const petName = capitalizeFirstLetter(c.req.param("petName") )
//   const activityName = capitalizeFirstLetter(c.req.param("activityName") )
//   const pet = parkEnvironment.getAllPets().find(pet => pet.name === petName)

//   if (!pet) {
//     return c.json({
//       message: `Pet ${petName} not found`
//     }, 404)
//   }

//   user1.askPetToDoActivity(pet, activityName).then((accepted : boolean) => {
//     if (accepted) {
//       console.log(`${petName} accepted the activity ${activityName}`)
//     } else {
//       console.log(`${petName} rejected the activity ${activityName}`)
//     }
//   })

//   return c.json({
//     message: `Activity request sent to ${petName} for ${activityName}`
//   })
// })

app.get("/*", serveStatic({root : './public'}))

export default app
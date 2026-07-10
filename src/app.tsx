import { VPItem, VPEnvironment, VPUser } from "./otherModels"
import { VPet } from "./pet"
import {Context, Hono, Next} from "hono"
// import { Layout, PetListComponent } from "./views"
// import { PetViewComponent} from "./views"
import { serveStatic } from "@hono/node-server/serve-static"
// import { renderToString } from "react-dom/server";
import { capitalizeFirstLetter } from "./utils"
import { SERVER_URL } from "./serverConfig.ts"
import { VPEnvironmentRemoteRef, VPetRemoteRef, VPUserRemoteRef } from "./remoteRefs.ts"
import { VPActivity } from "./petRepresentation.ts"
import {htmlLayoutString, petViewLayoutString, petActivityHistoryHtmlString, petViewHtmlString, environmentHtmlString} from "./htmlStrings"

type AppEnv = {
  Variables : {
    pet : VPet,
    environment : VPEnvironment,
    baseUrl : string
  }
}

const app = new Hono<AppEnv>()
app.get("/assets/*", serveStatic({root : './'}))

var users = new Map<string, VPUser>()
var pets = new Map<string, VPet>()
var environments = new Map<string, VPEnvironment>()

var user1 = new VPUser("userJune")
users.set(user1.name, user1)


// adding random pets based on beings images
var fs = require('fs');
var path = require('path');
var petImagesPath = path.join(__dirname, '../assets/images/beings');
var petImageFiles = fs.readdirSync(petImagesPath).filter((file : string) => file.endsWith('.png'));
// var randomPetImageFiles = petImageFiles.sort(() => 0.5 - Math.random()).slice(0, 6);
var randomPetImageFiles = petImageFiles.slice(0, 6);
randomPetImageFiles.forEach((file : string) => {
    var petName = file.replace('.png', '');
    var pet = new VPet(petName, SERVER_URL);
    // pet.imageSrc = `/assets/images/beings/${file}`;
    pets.set(pet.name.toLowerCase(), pet);
});


var homeEvironment = VPEnvironment.fromStringData("Home") 
var parkEnvironment = VPEnvironment.fromStringData("Park")
var schoolEnvironment = VPEnvironment.fromStringData("School")


environments.set(homeEvironment.name.toLowerCase(), homeEvironment)
environments.set(parkEnvironment.name.toLowerCase(), parkEnvironment)
environments.set(schoolEnvironment.name.toLowerCase(), schoolEnvironment)

const remoteServerUrl = "https://utensil-ahoy-ferocity.ngrok-free.dev"

var useRemotePark : boolean = false
const remotePark = new VPEnvironmentRemoteRef("Park", remoteServerUrl, "Remote Park")

if (useRemotePark) {
  pets.forEach(pet => {
    if (Math.random() < 0.5) {
      remotePark.addPet(pet.getRemoteRef())
    }
    else {
      parkEnvironment.addPet(pet.getRemoteRef())
    }
  })
} else {
  pets.forEach(pet => {
    parkEnvironment.addPet(pet.getRemoteRef())
  })
}


setInterval(() => {
  for (const pet of pets.values()) {
    pet.tick()
  }

}, 1000)



// --------- base urls -------

app.use("/*" ,async (c : Context, next: Next)=> {
  const baseUrl = new URL(c.req.url).origin
  const prefix = c.req.header("X-Forwarded-Prefix") || ""
  const prefixedUrl = baseUrl + prefix
  c.set("baseUrl", prefixedUrl)
  await next()
})

app.get("/", async (c) => {
  const allPetsStrings = `
  <div id="pets"> 
    ${Array.from(pets.values()).map(pet => {
       return petViewLayoutString(pet.getView(), c.get("baseUrl"), [
        petViewHtmlString(pet.getView(), c.get("baseUrl"))
      ]); 
    }) .join("")} 
  </div>
  `
  return c.html(htmlLayoutString([allPetsStrings], c.get("baseUrl")))
})

app.get("/federation/me", async (c) => {
  const baseUrl = new URL(c.req.url).origin
  const prefixedUrl = baseUrl + c.req.header("X-Forwarded-Prefix") 

  return c.json({
    serverUrl: prefixedUrl,
  })
})

app.get("/api/pets", async (c) => {
  return c.json({
    pets: Array.from(pets.values()).map(pet => { return pet.getView(); })
  })
})

app.get("/api/environments", async (c) => {
  return c.json({
    environments: Array.from(environments.values()).map(env => { return env.getRemoteRef(); })
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
  const petView = pet.getView()

  const accept = c.req.header("Content-Type") ?? ""
  const isJson = accept.includes("application/json")

  if (!isJson) {
    return c.html(
      htmlLayoutString(
        [
          petViewLayoutString(petView, c.get("baseUrl"), [
            petViewHtmlString(petView, c.get("baseUrl")),
            petActivityHistoryHtmlString()
          ])
        ],
        c.get("baseUrl"))
    )
  }


  return c.json({
    pet: pet.getView()
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
const environmentMiddleware = async (c: Context, next: Next) => {
  const environmentId = c.req.param("environmentId")!.toLowerCase()
  const environment = environments.get(environmentId)

  if (!environment) {
    return c.json({ message: `Environment ${environmentId} not found` }, 404)
  }

  c.set("environment", environment)
  await next()
}
app.use("/environments/:environmentId/*", environmentMiddleware)

app.get("/environments/:environmentId", environmentMiddleware, async (c) => {
  const environment = c.get("environment") as VPEnvironment
  const pets = environment.getAllPets()
  const petViews = await Promise.all(pets.map(async(pet) => await pet.getView()))

  const accept = c.req.header("Content-Type") ?? ""
  const isJson = accept.includes("application/json")

  if (!isJson) {
    return c.html(
      htmlLayoutString(
        [
          environmentHtmlString(environment, c.get("baseUrl"), [
            ...petViews.map(petView => {
                return petViewLayoutString(petView, c.get("baseUrl"), [
                  petViewHtmlString(petView, c.get("baseUrl"))
                ])
            })
          ])
        ],
        c.get("baseUrl"))
    )
  }


  return c.json({
    environment: environment.getRemoteRef()
  })
})

app.get("/environments/:environmentId/pets", async (c) => {
  const environment = c.get("environment") as VPEnvironment

  const allPets = environment.getAllPets()
  return c.json({
    pets: allPets
  })
})

app.get("/environments/:environmentId/items", async (c) => {
  const environment = c.get("environment") as VPEnvironment

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
  const environment = c.get("environment") as VPEnvironment
  const environmentId = c.req.param("environmentId")!
  
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

app.get("/*", serveStatic({root : './public'}))

export default app

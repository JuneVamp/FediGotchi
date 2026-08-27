import {Context, Hono, Next} from "hono"
import { serveStatic } from "@hono/node-server/serve-static"
import { cors } from "hono/cors";
import {setCookie, getCookie, deleteCookie} from "hono/cookie"
import { SERVER_URL } from "./serverConfig.ts"

import { VPActivityRemoteRef, VPEnvironmentRemoteRef, VPetRemoteRef, VPUserRemoteRef } from "./model/remoteRefs.ts"
import { VPItem, VPUser } from "./model/otherModels"
import { VPEnvironment } from "./model/environment.ts";
import { VPet } from "./model/pet"
import { VPActivity } from "./model/activity.ts"
import jsonData from "./model/data.json"

import {htmlLayoutString, petViewLayoutString, petActivityHistoryHtmlString, petViewHtmlString, environmentHtmlString, loginBox, petUserActionsHtmlString, petRelationshipsHtmlString, aboutHtmlString} from "./htmlStrings"
import { createSession, destroySession, getUser } from "./session.ts"
import { getRandomIntInclusive, writeToJsonFile } from "./utils.ts";

type AppEnv = {
  Variables : {
    pet : VPet,
    environment : VPEnvironment,
    currentUserId : string,
    activity : VPActivity,
    baseURL : string
  }
}

const app = new Hono<AppEnv>()

app.use("/*",
  cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'ngrok-skip-browser-warning'],
  // credentials: true,
}));



var users = new Map<string, VPUser>()
var pets = new Map<string, VPet>()
var environments = new Map<string, VPEnvironment>()
var activities = new Map<string, VPActivity>()
var running_activities = new Map<string, VPActivity>()

var user1 = new VPUser("userJune")
users.set(user1.name, user1)


// adding random pets based on beings images
var fs = require('fs');
var path = require('path');
var petImagesPath = path.join(__dirname, '../public/assets/images/beings');
var petImageFiles = fs.readdirSync(petImagesPath).filter((file : string) => file.endsWith('.png'));
// var randomPetImageFiles = petImageFiles.sort(() => 0.5 - Math.random()).slice(0, 6);
var randomPetImageFiles = petImageFiles.slice(0, 20);
randomPetImageFiles.forEach((file : string) => {
    var petName = file.replace('.png', '');
    var pet = new VPet(petName, SERVER_URL);
    // pet.imageSrc = `/assets/images/beings/${file}`;
    pets.set(pet.name.toLowerCase(), pet);
});

var numberOfEnvironments = 3;
for (const envName of jsonData.Environments.all) {
  numberOfEnvironments --;
  if (numberOfEnvironments < 0) {
    break;
  }
  var env = VPEnvironment.fromStringData(envName)
  env.remoteRef.setServerURL(SERVER_URL)
  environments.set(env.name.toLowerCase(), env)
}


pets.forEach(pet => {
  var pickEnvironmentInt = getRandomIntInclusive(0, environments.size - 1)
  pet.setEnvironment(Array.from(environments.values())[pickEnvironmentInt].getRemoteRef())
  // pet.setEnvironment(parkEnvironment.getRemoteRef())
})


// save all pets and environments to json file
var petsJson = Array.from(pets.values()).map(pet => pet.saveAsJson())
var environmentsJson = Array.from(environments.values()).map(env => env.saveAsJson())

writeToJsonFile('./data/pets.json', petsJson)
writeToJsonFile('./data/environments.json', environmentsJson)

setInterval(() => {
  // console.log(0)
  var timestamp = Date.now()
  for (const pet of pets.values()) {
    try {
      pet.tick(timestamp).catch((error) => {
        console.error(`Error ticking pet ${pet.name}:`, error);
      })
    } catch (error) {
      console.error(`Error ticking pet ${pet.name}:`, error);
    }
  }

  for (const activity of running_activities.values()) {
    try {
      activity.tick(timestamp).catch((error) => {
        console.error(`Error ticking activity ${activity.name}:`, error);
      })
    } catch (error) {
      console.error(`Error ticking activity ${activity.name}:`, error);
    }
  }

}, 1000)



// #region --------- login ---------

app.post("/login", async (c) => {
  const body = await c.req.parseBody()
  console.log("cookie set")

  const username = body.username as string
  const session = createSession(username);

  setCookie(c, "sessionId", session, {
    httpOnly: true,
    path: "/",
  });

  return c.redirect("/")
})

app.get("/current-user", async (c) => {
  const session = getCookie(c, "sessionId")
  const username = getUser(session)
  
  if (!username) {
    return c.json({
      message: "User not logged in"
    })
  }

  return c.json ({
      username: username
  })
})

app.post("/logout", async (c) => {
  const session = getCookie(c, "sessionId")
  destroySession(session)
  deleteCookie(c, "sessionId", { path: "/" })
  return c.redirect("/")
})

// #endregion

// #region --------- base urls -------

app.use("/*" ,async (c : Context, next: Next)=> {
  const baseURL = new URL(c.req.url).origin
  const prefix = c.req.header("X-Forwarded-Prefix") || ""
  const prefixedURL = baseURL + prefix
  // console.log("baseURL", baseURL)
  // console.log("prefixedURL", prefixedURL)
  c.set("baseURL", prefixedURL)
  await next()
})

app.get("/", async (c) => {
  const allPetsStrings = `
  <div id="pets"> 
    ${Array.from(pets.values()).map(pet => {
       return petViewLayoutString(pet.getView(), c.get("baseURL"), [
        petViewHtmlString(pet.getView(), c.get("baseURL"))
      ]); 
    }) .join("")} 
  </div>
  `
  return c.html(htmlLayoutString([
    allPetsStrings
  ], c.get("baseURL")))
})


app.get("/about", async (c) => {
  return c.html(htmlLayoutString([
    aboutHtmlString(c.get("baseURL"))
  ], c.get("baseURL")))
})

app.get("/federation/me", async (c) => {
  const baseURL = new URL(c.req.url).origin
  const prefixedURL = baseURL + c.req.header("X-Forwarded-Prefix") 

  return c.json({
    serverURL: prefixedURL,
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

// #endregion

// #region --------- pets -------

const petMiddleware = async (c: Context, next: Next) => {
  const petName = c.req.param("petId")!.toLowerCase()
  const pet = pets.get(petName)

  if (!pet) {
    return c.json({ message: `Pet ${petName} not found` }, 404)
  }

  c.set("pet", pet)
  c.set("currentUserId", getUser(getCookie(c, "sessionId")))
  await next() // FIXME 7 this throws an error... by nature? https://stackoverflow.com/questions/27101240/typeerror-converting-circular-structure-to-json-in-nodejs
}
app.use("/pets/:petId/*", petMiddleware)

app.get("/pets", async (c) => {
  const accept = c.req.header("Content-Type") ?? ""
  const isJson = accept.includes("application/json")
  
  if (!isJson) {
    const allPetsStrings = `
    <div id="pets"> 
      ${Array.from(pets.values()).map(pet => {
        return petViewLayoutString(pet.getView(), c.get("baseURL"), [
          petViewHtmlString(pet.getView(), c.get("baseURL"))
        ]); 
      }) .join("")} 
    </div>
    `
    return c.html(htmlLayoutString([
      allPetsStrings
    ], c.get("baseURL")))
  }
  return c.json({
    pets: Array.from(pets.values()).map(pet => { return pet.getView(); })
  })
})

// HACK 7 COMMENT json requests should get everything that i use to make the website, anyone can make their own website with the json data
// but i kinda return my own version of html for the pet view if looked up on browser 
// maybe i can seperate it to do that on soemthing like /site/pets/:petId and /api/pets/:petId for json data only
// or just build the website in the frontend with a js file and return just the shell of an html
app.get("/pets/:petId", petMiddleware, async (c) => {
  const pet = c.get("pet") as VPet
  const petView = pet.getView()
  if (!petView) {
    return c.json({
      message: `Pet ${pet.name} view not found`
    }, 404)
  }

  const accept = c.req.header("Content-Type") ?? ""
  const isJson = accept.includes("application/json")

  const petBaseURL = pet.getRemoteRef().serverURL

  if (!isJson) {
    return c.html(
      htmlLayoutString(
        [
          petViewLayoutString(petView, petBaseURL, [
            petViewHtmlString(petView, petBaseURL),
            petActivityHistoryHtmlString(),
            petRelationshipsHtmlString(),
            petUserActionsHtmlString(petView, petBaseURL)
          ])
        ],
        c.get("baseURL"))
    )
  }


  return c.json({
    pet: pet.getView()
  })
})

// expects body to have activityRemoteRef, activityPartnerType, activityPartnerId, activityPartnerServerURL
// FIXME 1 The user CANNOT call this (they do right now)
app.post("/pets/:petId/activity-request", async (c) => {
  const pet = c.get("pet")
  const body = await c.req.json()
  // console.log(5, pet.getRemoteRef().id )
  // const activityRequest = body as ActivityRequest

  var activityRemoteRef = new VPActivityRemoteRef(body.activity.id, body.activity.serverURL, body.activity.name)

  const activityPartnerType = body.activityPartnerType

  var activityPartner : VPetRemoteRef | VPUserRemoteRef | undefined = undefined
  if (activityPartnerType === "pet") {
    activityPartner = new VPetRemoteRef(body.activityPartnerId, body.activityPartnerServerURL)
  } 
  else if (activityPartnerType === "user") {
    // FIXME 2 this might break because user server is not saved
    const userId = c.get("currentUserId") as string
    console.log("currentUserId", userId)
    if (!userId) {
      return c.json({
        message: "User not logged in",
        accepted: false
      }, 401)
    }
    activityPartner = new VPUserRemoteRef( userId, body.activityPartnerServerURL)
  } 
  else {
    return c.json({
      message: `Activity partner type ${activityPartnerType} not supported`,
      accepted: false
    }, 400)
  }

  var activityData = await activityRemoteRef.getActivityData()
  if (activityData === null) {
    return c.json({
      message: `Activity data for activity ${activityRemoteRef.id} not found`,
      accepted: false
    }, 404)
  }

  var activity = VPActivity.fromJson(activityData)
  activity.remoteRef = activityRemoteRef

  const accepted = await pet.receiveActivityRequest(activity, activityPartner);
  return c.json({
    message: `Pet ${pet.name} received activity request for activity ${activity.name} from ${activityPartnerType} ${activityPartner.id}`,
    accepted: accepted
  });

})

app.post("/pets/:petId/activity-tick", async (c) => {
  const pet = c.get("pet")
  const body = await c.req.json()
  var activityId = body.activityId
  var activityServerURL = body.activityServerURL
  var activityName = body.name
  var activity = new VPActivityRemoteRef(activityId, activityServerURL, activityName)

  if(!pet.currentActivity || pet.currentActivity.getRemoteRef()?.id !== activityId){
    return c.json({
      message: `Pet ${pet.name} is not currently in activity ${activityId}`,
      accepted: false
    }, 400)
  } else {
    var response = await pet.processActivityTick(activityId, Date.now())
    return c.json({
      message: `Pet ${pet.name} ticked activity ${activityId}`,
      accepted: true
    })
  }
})

app.post("/pets/:petId/activity-finished", async (c) => {
  const pet = c.get("pet")
  const body = await c.req.json()
  var activityId = body.activityId
  var activityServerURL = body.activityServerURL
  var activityName = body.name
  var activity = new VPActivityRemoteRef(activityId, activityServerURL, activityName)

  if(!pet.currentActivity || pet.currentActivity.getRemoteRef()?.id !== activityId){
    console.log(`Pet ${pet.name} is not currently in activity ${activityId}`)
    return c.json({
      message: `Pet ${pet.name} is not currently in activity ${activityId}`,
      accepted: false
    }, 400)
  } else {
    var response = await pet.processActivityFinished()
    return c.json({
      message: `Pet ${pet.name} finished activity ${activityId}`,
      accepted: true
    })
  }

})


// HACK 6 there should NOT be 2 ways (1 in env and 1 in pet) to  do this
app.post("/pets/:petId/set-environment", async (c) => {
  const pet = c.get("pet")
  const body = await c.req.json()
  // const environment = new VPEnvironmentRemoteRef(body.environmentId, body.environmentServerURL)
  // const response =  environment.addPet(pet.getRemoteRef())
  const response = await pet.setEnvironment(new VPEnvironmentRemoteRef(body.environment.id, body.environment.serverURL))
  return c.json({
    message: `Pet ${pet.name}  set to environment ${body.environment.id}`,
    accepted: response
  })
})

app.post("/pets/:petId/set-owner", async (c) => {
  const pet = c.get("pet")
  const body = await c.req.json()
  pet.owner = new VPUserRemoteRef(body.ownerId, body.ownerServerURL)
  const response = await pet.setOwner(new VPUserRemoteRef(body.ownerId, body.ownerServerURL))
  return c.json({
    message: `Pet ${pet.name} ${response.accepted ? 'successfully' : 'failed'} set to owner ${body.ownerId}`,
    accepted: response.accepted
  })
})

// #endregion

// #region --------- environments -------
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

app.get("/environments", async (c) => {
  const accept = c.req.header("Content-Type") ?? ""
  const isJson = accept.includes("application/json")

  if (!isJson) {
    var allEnvironmentsHTML = ""
    for (var environment of environments.values()) {
      const pets = environment.getAllPets()
      const petViews = await Promise.all(pets.map(async(pet) => await pet.getView()))

      allEnvironmentsHTML += environmentHtmlString(environment.getView(), c.get("baseURL"), [
        ...petViews.map(petView => {
            return petViewLayoutString(petView, petView.remoteRef.serverURL, [
              petViewHtmlString(petView, petView.remoteRef.serverURL)
            ])
        })
      ])
    }
    return c.html(htmlLayoutString([
      `<div id="environments">`
      + allEnvironmentsHTML 
      + `</div>`
    ], c.get("baseURL")))
  }
  return c.json({
    environments: Array.from(environments.values()).map(env => { return env.getRemoteRef(); })
  })
})

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
          environmentHtmlString(environment.getView(), c.get("baseURL"), [
            ...petViews.map(petView => {
                return petViewLayoutString(petView, petView.remoteRef.serverURL, [
                  petViewHtmlString(petView, petView.remoteRef.serverURL)
                ])
            })
          ])
        ],
        c.get("baseURL"))
    )
  }


  return c.json({
    environment: environment.getView(),
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
        activity: item.getActivity() ? item.getActivity()! : undefined
      }
    })
  })
})

app.post("/environments/:environmentId/add-pet", async (c) => {
  const environment = c.get("environment") as VPEnvironment
  const environmentId = c.req.param("environmentId")!
  
  const body = await c.req.json()
  const pet = new VPetRemoteRef(body.petId, body.petServerURL)
  // const petView = await pet.getView()
  // if (petView.environmentRemoteRef) {
  //   const previousEnvironmentRemoteRef = new VPEnvironmentRemoteRef(petView.environmentRemoteRef!.id, petView.environmentRemoteRef!.serverURL )
  //   await previousEnvironmentRemoteRef.removePet(pet)
  // }
  environment.addPet(pet)
  return c.json({
    message: `Pet ${body.petId} added to environment ${environmentId}`,
    accepted: true
  })
})


app.post("/environments/:environmentId/remove-pet", async (c) => {
  const environment = c.get("environment") as VPEnvironment
  const body = await c.req.json()
  const pet = new VPetRemoteRef(body.petId, body.petServerURL)
  const response = await environment.removePet(pet)
  return c.json({
    message: `Pet ${body.petId} removed from environment ${environment.name}`,
    accepted: response
  })
})

#endregion

#region --------- users ----------
app.get("/users/:userId", async (c) => {
  // TODO 1
})

app.post("/users/create", async (c) => {

})

app.post("/users/login",  async (c) => {
  const formData = await c.req.formData()
  const userId = formData.get("userId")
  if (typeof userId != "string"){
    return
  }

  localStorage.setItem("currentUserId", userId)
})

// #endregion

// #region ------------ activities ------------
const activityMiddleware = async (c: Context, next: Next) => {
  const activityId = c.req.param("activityId")!
  const activity = activities.get(activityId)
  if (!activity) {
    return c.json({
      message: `Activity ${activityId} not found`
    }, 404)
  }

  c.set("activity", activity)
  await next()
}

app.get("/activities/:activityId", activityMiddleware, async (c) =>{
  const activity = c.get("activity") as VPActivity
  return c.json({
    activity: activity.getRemoteRef()
  })
})

app.get("/activities/:activityId/data", activityMiddleware, async (c) => {
  var activity = c.get("activity") as VPActivity
  // console.log(`Activity ${activity.name} data requested`)

  return c.json({
    activity: activity
  })

})

app.get("/activities/:activityId/entities", activityMiddleware, async (c) => {
  var activity = c.get("activity") as VPActivity
  return c.json({
    entities: activity.getEntities()
  })
})

// CREATES
app.post("/activities/:activityId/add-starter-entity", async (c) => {
  var activityId = c.req.param("activityId")!
  var body = await c.req.json()
  var entityType = body.entityType
  var entityId = body.entityId
  var entityServerURL = body.entityServerURL
  var activityName = body.activityName

  if(activities.get(activityId)){
    throw new Error(`Activity ${activityId} already exists, curent timestamp: ${Date.now()}`)
  }

  var activity = VPActivity.fromStringData(activityName)
  activity.createRemoteRef(activityId, c.get("baseURL"))
  activity.addEntity(entityType === "pet" ? new VPetRemoteRef(entityId, entityServerURL) : new VPUserRemoteRef(entityId, entityServerURL))
  activity.status = "active"
  activities.set(activityId, activity)

  return c.json({
    message: `Activity ${activityId} created with starter entity ${entityType} ${entityId}`
  })
})

// start activity
app.post("/activities/:activityId/start", activityMiddleware, async (c) => {
  var activity = c.get("activity") as VPActivity
  var activityId = c.req.param("activityId")!

  running_activities.set(activityId, activity)
  activity.finishedCallback = () => {
    running_activities.delete(activityId)
  }

  return c.json({
    message: `Activity ${activityId} started`
  })

})

app.post("/activities/:activityId/add-entity", activityMiddleware, async (c) => {
  var activity = c.get("activity") as VPActivity
  var body = await c.req.json()
  var entityType = body.entityType
  var entityId = body.entityId
  var entityServerURL = body.entityServerURL

  var entity = entityType === "pet" ? new VPetRemoteRef(entityId, entityServerURL) : new VPUserRemoteRef(entityId, entityServerURL)
  activity.addEntity(entity)

  return c.json({
    message: `Entity ${entityType} ${entityId} added to activity ${activity.name}`
  })
})

app.post("/activities/:activityId/request-entity-join", activityMiddleware, async (c) => {
  var activity = c.get("activity") as VPActivity
  var body = await c.req.json()
  var entityType = body.entityType
  var entityId = body.entityId
  var entityServerURL = body.entityServerURL


  var entity = entityType === "pet" ? new VPetRemoteRef(entityId, entityServerURL) : new VPUserRemoteRef(entityId, entityServerURL)
  var response = await activity.requestEntityJoin(entity)
  return c.json({
    message: `Entity ${entityType} ${entityId} requested to join activity ${activity.name}`,
    response: response
  })
})


// #endregion


app.get("/*", serveStatic({root : './public'}))

export default app

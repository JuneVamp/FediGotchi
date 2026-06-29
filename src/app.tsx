import { VPItem, VPEnvironment, VPUser } from "./otherModels"
import { VPet } from "./pet"
import {Hono} from "hono"
import { Layout, PetListComponent } from "./views"
import { serveStatic } from "@hono/node-server/serve-static"
import { capitalizeFirstLetter } from "./utils"

const app = new Hono()
app.get("/assets/*", serveStatic({root : './'}))

var users = new Map<string, VPUser>()
var pets = new Map<string, VPet>()
var environments = new Map<string, VPEnvironment>()

var user1 = new VPUser("userJune")
users.set(user1.name, user1)
  
var pet1 = new VPet("Alice")
var pet2 = new VPet("Brice")
var pet3 = new VPet("Cami")
var pet4 = new VPet("Dani")

pets.set(pet1.name, pet1)
pets.set(pet2.name, pet2)
pets.set(pet3.name, pet3)
pets.set(pet4.name, pet4)

var homeEvironment = VPEnvironment.fromStringData("Home") 
var parkEnvironment = VPEnvironment.fromStringData("Park")
var schoolEnvironment = VPEnvironment.fromStringData("School")

environments.set(homeEvironment.name, homeEvironment)
environments.set(parkEnvironment.name, parkEnvironment)
environments.set(schoolEnvironment.name, schoolEnvironment)

parkEnvironment.addPet(pet1)
parkEnvironment.addPet(pet2)
parkEnvironment.addPet(pet3)
parkEnvironment.addPet(pet4)


setInterval(() => {
  pet1.tick()
  pet2.tick()
  pet3.tick()
  pet4.tick()

}, 1000)


app.get("/*", serveStatic({root : './public'}))

app.get("/api/pets", async (c) => {
  const allPets = parkEnvironment.getAllPets().map(pet => pet.getView())

  return c.json({
    pets: allPets
  })
})

app.post("/api/pets/:pet/post", async (c) => {
  const body = await c.req.json()
  console.log(body)
  const petName = capitalizeFirstLetter(c.req.param("pet"))
  const userName = body.userName
  var returnMessage = ""

  const postType = body.postType
  switch (postType) {
    case "UserPetActivity":
      const activityName = capitalizeFirstLetter(body.activityName)
      const pet = pets.get(petName)
      const user = users.get(userName)

      if (!user){
        return c.json({
          message: `User ${userName} not found`
        }, 404)
      }

      user.askPetToDoActivity(pet!, activityName).then((accepted : boolean) => {
        if (accepted) {
          returnMessage = `Activity request accepted for ${petName}`
        } else {
          returnMessage = `Activity request rejected for ${petName}`
        }
      })

    case undefined:
      returnMessage = "No postType provided"
      break
  }

  return c.json({
    message: returnMessage
  })

})

app.post("/api/pets/:petName/activities/:activityName", async (c) => {

  const petName = capitalizeFirstLetter(c.req.param("petName") )
  const activityName = capitalizeFirstLetter(c.req.param("activityName") )
  const pet = parkEnvironment.getAllPets().find(pet => pet.name === petName)

  if (!pet) {
    return c.json({
      message: `Pet ${petName} not found`
    }, 404)
  }

  user1.askPetToDoActivity(pet, activityName).then((accepted : boolean) => {
    if (accepted) {
      console.log(`${petName} accepted the activity ${activityName}`)
    } else {
      console.log(`${petName} rejected the activity ${activityName}`)
    }
  })

  return c.json({
    message: `Activity request sent to ${petName} for ${activityName}`
  })
})

export default app
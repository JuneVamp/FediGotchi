import { VPItem, VPEnvironment, VPUser } from "./otherModels"
import { VPet } from "./pet"
import {Hono} from "hono"
import { Layout, PetListComponent } from "./views"
import { serveStatic } from "@hono/node-server/serve-static"

const app = new Hono()
app.get("/assets/*", serveStatic({root : './'}))


var user1 = new VPUser("UserJune")
  
var pet1 = new VPet("Alice")
var pet2 = new VPet("Brice")
var pet3 = new VPet("Cami")
var pet4 = new VPet("Dani")

var homeEvironment = VPEnvironment.fromStringData("Home") 
var parkEnvironment = VPEnvironment.fromStringData("Park")
var schoolEnvironment = VPEnvironment.fromStringData("School")

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

// app.get('/', (c) => {
//   return c.text('Hello Hono!')
// })

app.get("/api/pets", async (c) => {
  const allPets = parkEnvironment.getAllPets().map(pet => pet.getView())

  return c.json({
    pets: allPets
  })
})

app.post("/api/pets/:petName/activities/:activityName", async (c) => {
  const petName = c.req.param("petName")
  const activityName = c.req.param("activityName")
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



// app.get("/pet", async (c) => {

//   return c.html(
//     <Layout>
//       <PetListComponent pets = {parkEnvironment.getAllPets().map(pet => pet.getView())}></PetListComponent>
//     </Layout>
//   )
// })

export default app
import { VPItem, VPEnvironment } from "./otherModels"
import { VPet } from "./petModel"
import {Hono} from "hono"
import { Layout, PetListComponent } from "./views"
import { serveStatic } from "@hono/node-server/serve-static"

const app = new Hono()
app.get("/assets/*", serveStatic({root : './'}))

var pet1 = new VPet("Alice")
var pet2 = new VPet("Brice")

var item1 = VPItem.fromStringData("Ball")
var item2 = VPItem.fromStringData("Book")

var environment = new VPEnvironment("Test Environment")
environment.addPet(pet1)
environment.addPet(pet2)
environment.addItem(item1)
environment.addItem(item2)

setInterval(() => {
  pet1.tick()
  pet2.tick()

  console.log(`Pet1 - Boredom: ${pet1.stats.boredom.value}, boredomTimer: ${pet1.tempBoredomTimer}, Energy: ${pet1.stats.energy.value}`)
  console.log(`Pet2 - Boredom: ${pet2.stats.boredom.value}, boredomTimer: ${pet2.tempBoredomTimer}, Energy: ${pet2.stats.energy.value}`)

}, 1000)


app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get("/pet", async (c) => {

  return c.html(
    <Layout>
      <PetListComponent pets = {environment.getAllPets().map(pet => pet.getView())}></PetListComponent>
    </Layout>
  )
})

export default app
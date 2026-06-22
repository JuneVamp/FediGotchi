import { VPActivity, VPPersonality, VPStat, VPStats } from "./petRepresentation"
import { VPEntity } from "./petRepresentation"
import { VPEnvironment, VPItem } from "./otherModels"
import { parseActivity } from "./parser"
import { weighted_random, getRandomInt } from "./utils"

export interface PetView{
    name : string
    imageSrc : string
    environmentName : string
    boredom : number
    currentActivityName : string
    currentActivityPartnerN : string
}

export class VPet extends VPEntity {
    personality : VPPersonality = new VPPersonality()
    stats : VPStats = new VPStats()
    environment ?: VPEnvironment
    currentActivity ?: VPActivity
    knownActivitesPetxPet : Array<VPActivity> = []
    tempBoredomTimer : number = 0
    tempPetView : PetView = {
        name : this.name,
        imageSrc : `../assets/images/pets/${this.name.toLowerCase()}.png`,
        environmentName : this.environment ? this.environment.name : "No Environment",
        boredom : this.stats.boredom.value,
        currentActivityName : this.currentActivity ? this.currentActivity.name : "No Activity",
        currentActivityPartnerN : "No Partner"
    }

    constructor (name : string){
        super(name)
        this.knownActivitesPetxPet = ["Play", "Talk"].map((activityName : string) => {
            return parseActivity(activityName)
        });
    }

    //---------------------Activity Methods--------------------
    initiateActivity(){
        if (!this.environment) {
            return
        }

        // activity selection
        var priorityList : Array<{activity : VPActivity, willingness : number}> = []

        // Environment Activites
        this.environment.getAllItems().forEach(item => {
            if (item.activity){
                priorityList.push({
                    activity : item.activity,
                    willingness : this.willingToActivity(item.activity)})
            }
        });

        // Pet x Pet Activities
        for (const activity of this.knownActivitesPetxPet) {
                priorityList.push({
                    activity : activity,
                    willingness : this.willingToActivity(activity)
                })
        }

        priorityList = priorityList.sort((a, b) => b.willingness - a.willingness)
        var selectedActivity : VPActivity = weighted_random(priorityList.map((entry) => {
            return {
                item : entry.activity,
                weight : entry.willingness
            }
        }));

        // partner selection
        var selectedActivityPartner = weighted_random(this.environment.getAllPets().filter((pet) => pet !== this).map((pet) => {
            return {
                item : pet,
                weight : 100
            }
        }));

        this.sendActivityRequest(selectedActivity, selectedActivityPartner).then((accepted : boolean) => {
            if (accepted) {
                this.doActivity(selectedActivity, selectedActivityPartner)
            }
        })

    }

    acceptActivity(activity : VPActivity, activityPartner : VPEntity | VPItem) : boolean{
        if (this.currentActivity) {
            console.log(`${this.name} is already doing ${this.currentActivity.name}, cannot accept ${activity.name}`)
            return false
        }

        if (!this.willingToActivity(activity)){
            return false
        }

        this.doActivity(activity, activityPartner)
        return true
    }

    doActivity(activity : VPActivity, activityPartner : VPEntity | VPItem){
        console.log(`${this.name} is doing ${activity.name} with ${activityPartner.name}`)
        this.currentActivity = activity
    }

    willingToActivity(activity : VPActivity) : number{
        //TODO
        return 100
    }


    // async methods
    receiveActivityRequest(activity : VPActivity, activityPartner : VPEntity | VPItem) : Promise<boolean>{
        console.log(`Received activity request for ${activity.name} from ${activityPartner.name}`)
        return new Promise((resolve, reject) => {
            resolve(this.acceptActivity(activity, activityPartner))
        })
    }

    sendActivityRequest(activity : VPActivity, activityPartner : VPEntity | VPItem) : Promise<boolean>{
        console.log(`Sending activity request for ${activity.name} to ${activityPartner.name}`)
        return new Promise((resolve, reject) => {
            if (activityPartner instanceof VPet) {
                activityPartner.receiveActivityRequest(activity, this).then((accepted : boolean) => {
                    resolve(accepted)
                })
            } else {
                resolve(false)
            }
        })
    }

    //---------------------Other Methods--------------------
    tick(){
        this.stats.getAllStats().forEach((stat : VPStat) => {
            stat.value += 1
        })
        // emit tick event
        this.afterTickTemp()
    }

    afterTickTemp(){
        this.tempBoredomTimer += getRandomInt(2)
        if (this.tempBoredomTimer >= 10) {
            this.tempBoredomTimer = 0
            this.initiateActivity()
        }
    }

    // -------------View Methods--------------------
    getView() : PetView{
        this.tempPetView.environmentName = this.environment ? this.environment.name : "No Environment"
        this.tempPetView.boredom = this.stats.boredom.value
        this.tempPetView.currentActivityName = this.currentActivity ? this.currentActivity.name : "No Activity"
        return this.tempPetView
    }

}

import { createDefaultStats, VPActivity, VPPersonality, VPStats } from "./petRepresentation"
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
    currentActivityPartnerName : string
    getModel(): VPet
}

export class VPet extends VPEntity {
    personality : VPPersonality = new VPPersonality()
    stats : VPStats = createDefaultStats()
    environment ?: VPEnvironment
    currentActivity ?: VPActivity

    // HACK 7
    knownActivitesPetxPet : Array<VPActivity> = []
    timeBetweenActivityInitiation : number = 10

    activityTickTimer : number = -1
    perTickStatChangesDict : VPStats = {
        "hunger" : 1,
        "boredom" : 1,
    }


    tempPetView : PetView = {
        name : this.name,
        imageSrc : `../assets/images/pets/${this.name.toLowerCase()}.png`,
        environmentName : this.environment ? this.environment.name : "No Environment",
        boredom : this.stats.boredom,
        currentActivityName : this.currentActivity ? this.currentActivity.name : "No Activity",
        currentActivityPartnerName : "No Partner",
        getModel : () => this
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
        // console.log(`${this.name} is doing ${activity.name} with ${activityPartner.name}`)
        this.timeBetweenActivityInitiation = 0

        if (!activity.entitiesInvolved.includes(this)) {
            activity.entitiesInvolved.push(this)
        }
        this.currentActivity = activity
    }

    willingToActivity(activity : VPActivity) : number{
        //TODO 9 randomness
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

    //---------------------Tick Methods--------------------
    tick(){
        //TODO 8 emit tick event

        this.perTickStatChanges()
        this.processInitiations()
        this.processActivityTick()
    }

    perTickStatChanges(){
        this.processStatChanges(this.perTickStatChangesDict)
    }

    processInitiations(){
        if (!this.currentActivity && this.environment) {
            // TODO 9 randomness
            if (this.timeBetweenActivityInitiation >= 10) {
                this.initiateActivity()
            } else {
                this.timeBetweenActivityInitiation ++
            }
        }
    }

    processActivityTick(){
        if (this.currentActivity) {

            this.processStatChanges(this.currentActivity.statAffected)

            this.activityTickTimer ++;
            if (this.activityTickTimer >= this.currentActivity.maxTicks) {
                this.currentActivity = undefined
                this.activityTickTimer = -1
            }
        }
    }

    processStatChanges(statChanges : VPStats){
        for (const [statName, changeInValue] of Object.entries(statChanges)) {
            if (this.stats.hasOwnProperty(statName)) {
                this.stats[statName] += changeInValue
            }
        }

        // clamp
        for (const [statName, value] of Object.entries(this.stats)) {
            if (value < 0) {
                this.stats[statName] = 0
            } else if (value > 100) {
                this.stats[statName] = 100
            }
        }
    }

    // -------------View Methods--------------------
    getView() : PetView{
        this.tempPetView.environmentName = this.environment ? this.environment.name : "No Environment"
        this.tempPetView.boredom = this.stats.boredom
        this.tempPetView.currentActivityName = this.currentActivity ? this.currentActivity.name : "No Activity"
        if (this.currentActivity) {
            var partner = this.currentActivity.entitiesInvolved.find(ent => ent !== this)
            this.tempPetView.currentActivityPartnerName = partner ? partner.name : "No Partner"
        } else {
            this.tempPetView.currentActivityPartnerName = "No Partner"
        }
        return this.tempPetView
    }

}

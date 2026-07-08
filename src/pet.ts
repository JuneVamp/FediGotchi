import { createDefaultStats, VPActivity, VPPersonality, VPStats } from "./petRepresentation"
import { VPEntity } from "./petRepresentation"
import { VPEnvironment, VPItem, VPUser } from "./otherModels"
import { parseActivityFromName } from "./parser"
import { weighted_random, getRandomInt } from "./utils"
import {VPEnvironmentRemoteRef, VPUserRemoteRef, VPetRemoteRef} from "./remoteRefs"

// @ts-ignore - JavaScript module without type declarations.
import { petViewHtmlString } from "./htmlStrings"

export interface PetView{
    name : string
    imageSrc : string
    environmentName : string
    boredom : number
    currentActivityName : string
    currentActivityPartnerName : string
    stats : VPStats,
    remoteRef : VPetRemoteRef
    environmentRemoteRef ?: VPEnvironmentRemoteRef
    activityPartnerRemoteRef ?: VPetRemoteRef | VPUserRemoteRef | VPItem
}

export enum petState {
    idle = "idle",
    doingActivity = "doingActivity",
    waitingForActivityResponse = "waitingForActivityResponse",
    reservedForActivity = "reservedForActivity"
}

export class VPet extends VPEntity {
    personality : VPPersonality = new VPPersonality()
    stats : VPStats = createDefaultStats()
    environment ?: VPEnvironmentRemoteRef 
    currentActivity ?: VPActivity
    reservedForActivity ?: VPActivity
    state : petState = petState.idle

    // HACK 7
    knownActivitesPetxPet : Array<VPActivity> = []
    timeBetweenActivityInitiation : number = 10

    activityTickTimer : number = -1
    perTickStatChangesDict : VPStats = {
        "hunger" : 1,
        "boredom" : 1,
        "happiness" : -1,
        "energy" : -1
    }


    tempPetView : PetView = {
        name : this.name,
        imageSrc : `../assets/images/beings/${this.name.toLowerCase()}.png`,
        environmentName : this.environment ? this.environment.displayName : "null",
        boredom : this.stats.boredom,
        currentActivityName : this.currentActivity ? this.currentActivity.name : "null",
        currentActivityPartnerName : "null",
        stats : this.stats,
        remoteRef : new VPetRemoteRef(this.name, "")
        }

    remoteRef : VPetRemoteRef 

    constructor (name : string, serverUrl : string){
        super(name)

        this.remoteRef = new VPetRemoteRef(this.name, serverUrl)

        // HACK 7 only does known activities, does not query environment for activities or items
        this.knownActivitesPetxPet = ["Play", "Talk"].map((activityName : string) => {
            return parseActivityFromName(activityName)
        });
    }

    //---------------------Activity Methods--------------------
    initiateActivity(){
        // TODO 5 Solo item activities
        // TODO 8 ask user
        if (!this.environment) {
            console.log(`${this.name} is not in an environment, cannot initiate activity`)
            return
        }

        // activity selection
        var priorityList : Array<{activity : VPActivity, willingness : number}> = []

        // Environment Activites
        this.environment.getAllItems().then((items) => {
            items.forEach(item => {
                if (item.activity){
                    priorityList.push({
                        activity : item.activity,
                        willingness : this.willingToActivity(item.activity)})
                    }
                })
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
        this.environment.getAllPets().then((pets) => {
            const eligiblePets = pets.filter((pet) => !pet.checkEqual(this.remoteRef))
            if (eligiblePets.length === 0) {
                console.log(`No eligible pets for ${this.name} to do activity ${selectedActivity.name}`) 
                return
            }

            var selectedActivityPartner = weighted_random(
                eligiblePets.map((pet) => {
                    return {
                        item : pet,
                        weight : 100
                    }
                })
            )


            this.sendActivityRequest(selectedActivity, selectedActivityPartner).then((accepted : any) => {
                this.state = petState.idle
                if (accepted) {
                    this.doActivity(selectedActivity, selectedActivityPartner)
                } else {
                }
            })
        })

    }

    acceptActivity(activity : VPActivity, activityPartner : VPetRemoteRef | VPUserRemoteRef | VPItem) : boolean{
        if (this.state !== petState.idle) {
            return false
        }

        if (!this.willingToActivity(activity)){
            return false
        }

        this.doActivity(activity, activityPartner)
        return true
    }

    doActivity(activity : VPActivity, activityPartner : VPetRemoteRef | VPUserRemoteRef | VPItem){
        console.log(`${this.name} of ${this.remoteRef.serverURL} is doing activity ${activity.name} with ${activityPartner instanceof VPetRemoteRef ? activityPartner.id : activityPartner instanceof VPUserRemoteRef ? activityPartner.id : activityPartner.name} of server ${activityPartner instanceof VPetRemoteRef || activityPartner instanceof VPUserRemoteRef ? activityPartner.serverURL : "local"}`)
        this.state = petState.doingActivity
        this.timeBetweenActivityInitiation = 0

        activity.entitiesInvolved.push(this.remoteRef)
        activity.entitiesInvolved.push(activityPartner)

        this.currentActivity = activity
    }

    willingToActivity(activity : VPActivity) : number{
        //TODO 9 randomness
        return 100
    }


    // --------------------async methods--------------------

    async receiveActivityRequest(activity : VPActivity, activityPartner : VPetRemoteRef| VPUserRemoteRef | VPItem) : Promise<boolean>{
        if (activityPartner instanceof VPetRemoteRef) {
            console.log(`${this.name} of ${this.remoteRef.serverURL} received activity request for ${activity.name} from ${activityPartner.id} of server ${activityPartner.serverURL}`)
        }
        return new Promise((resolve, reject) => {
            resolve(this.acceptActivity(activity, activityPartner))
        })
    }



    async sendActivityRequest(activity : VPActivity, activityPartner : VPetRemoteRef | VPItem | VPUserRemoteRef) : Promise<boolean>{
        const activityID = this.remoteRef.id + "@" + this.remoteRef.serverURL + "@" + Date.now().toString()

        return new Promise((resolve, reject) => {
            if (activityPartner instanceof VPetRemoteRef) {
                console.log(`${this.name} of ${this.remoteRef.serverURL} is sending activity request for ${activity.name} to ${activityPartner.id} of server ${activityPartner.serverURL}`)
                this.state = petState.waitingForActivityResponse
                this.reservedForActivity = activity
                this.reservedForActivity.timeout = setTimeout(() => {
                    this.state = petState.idle
                    this.currentActivity = undefined
                    resolve(false)
                }, 5000)

                activityPartner.sendActivityRequest(activity, this.remoteRef, activityID).then((accepted : boolean) => {
                    if (this.reservedForActivity?.timeout) {
                        clearTimeout(this.reservedForActivity.timeout)
                    }
                    resolve(accepted)
                })
            } else {
                // FIXME 7 item and user activity request not implemented
                resolve(false)
            }
        })
    }

    //---------------------Tick Methods--------------------
    tick(){
        //TODO 8 emit tick event

        if (this.state === petState.idle) {
            this.perTickStatChanges()
            this.processInitiations()
        } else if (this.state === petState.doingActivity) {
            this.processActivityTick()
        }

    }

    perTickStatChanges(){
        this.processStatChanges(this.perTickStatChangesDict)
    }

    processInitiations(){
        if (this.environment) {
            // TODO 9 randomness
            if (this.timeBetweenActivityInitiation >= 10) {
                this.initiateActivity()
            } else {
                this.timeBetweenActivityInitiation ++
            }
        }
    }

    processActivityTick(){
        if (this.currentActivity) { // TODO 9 not needed

            this.processStatChanges(this.currentActivity.statAffected)

            this.activityTickTimer ++;
            if (this.activityTickTimer >= this.currentActivity.maxTicks) {
                this.currentActivity = undefined
                this.state = petState.idle
                this.activityTickTimer = -1
            }
        }
    }

    processStatChanges(statChanges : VPStats){
        for (const [statName, changeInValue] of Object.entries(statChanges)) {
            if (this.stats.hasOwnProperty(statName)) {
                this.stats[statName] += changeInValue
            } else {
                console.warn(`Stat ${statName} does not exist on ${this.name}`)
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
        this.tempPetView.environmentName = this.environment ? this.environment.displayName : "null"
        this.tempPetView.boredom = this.stats.boredom
        this.tempPetView.currentActivityName = this.currentActivity ? this.currentActivity.name : "null"
        if (this.currentActivity) {
            var partner = this.currentActivity.entitiesInvolved.filter((ent) => {
                if (ent instanceof VPetRemoteRef) {
                    if (!ent.checkEqual(this.remoteRef)) {
                        this.tempPetView.currentActivityPartnerName = ent.id
                        return true
                    }
                } else if (ent instanceof VPUserRemoteRef) {
                        this.tempPetView.currentActivityPartnerName = ent.id
                        return true
                } else if (ent instanceof VPItem) {
                    this.tempPetView.currentActivityPartnerName = ent.name
                    return true
                }
                return true
                
            })
        } else {
            this.tempPetView.currentActivityPartnerName = "null"
        }
        this.tempPetView.stats = this.stats
        this.tempPetView.remoteRef = this.remoteRef
        this.tempPetView.environmentRemoteRef = this.environment
        this.tempPetView.activityPartnerRemoteRef = this.currentActivity ? this.currentActivity.entitiesInvolved.find((ent) => {
            if (ent instanceof VPetRemoteRef) {
                return !ent.checkEqual(this.remoteRef)
            }
            return false
        }) : undefined
        return this.tempPetView
    }

    getHTMLView(baseUrl : string) : string{
        return petViewHtmlString(this.getView(), baseUrl)
    }

    getRemoteRef() : VPetRemoteRef{
        this.remoteRef.id = this.name
        return this.remoteRef
    }

}

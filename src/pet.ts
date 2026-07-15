import { ActivityHistoryDict, createDefaultStats, VPActivity, VPRelationship, VPRelationshipDict, VPStats } from "./petRepresentation"
import { VPEntity } from "./petRepresentation"
import { VPEnvironment, VPItem, VPUser } from "./otherModels"
import { parseActivityFromName } from "./parser"
import { weighted_random, getRandomInt, getRandomIntInclusive } from "./utils"
import {VPEnvironmentRemoteRef, VPUserRemoteRef, VPetRemoteRef} from "./remoteRefs"

// @ts-ignore - JavaScript module without type declarations.
import { petViewLayoutString } from "./htmlStrings"
import { stat } from "node:fs"

export interface PetView{
    name : string
    imageSrc : string
    environmentName : string
    boredom : number
    currentActivityName : string
    currentActivityPartnerName : string
    currentActivityItemName : string
    stats : VPStats,
    remoteRef : VPetRemoteRef
    environmentRemoteRef ?: VPEnvironmentRemoteRef
    activityPartnerRemoteRef ?: VPetRemoteRef | VPUserRemoteRef
    activityItem ?: VPItem
    activityHistory ?: ActivityHistoryDict
    relationships ?: VPRelationshipDict
}

export enum petState {
    idle = "idle",
    doingActivity = "doingActivity",
    waitingForActivityResponse = "waitingForActivityResponse",
    reservedForActivity = "reservedForActivity"
}

export class VPet extends VPEntity {
    // personality : VPPersonality = new VPPersonality()
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

    activityHistory : ActivityHistoryDict = {}


    tempPetView : PetView = {
        name : this.name,
        imageSrc : `assets/images/beings/${this.name}.png`,
        environmentName : this.environment ? this.environment.displayName : "null",
        stats : this.stats,
        boredom : this.stats.boredom,
        currentActivityName : this.currentActivity ? this.currentActivity.name : "null",
        currentActivityPartnerName : "null",
        currentActivityItemName : "null",
        remoteRef : new VPetRemoteRef(this.name, "")
        }

    remoteRef : VPetRemoteRef 

    constructor (name : string, serverUrl : string){
        super(name)

        this.remoteRef = new VPetRemoteRef(this.name, serverUrl)

        // HACK 7 : un-hardcode this
        this.knownActivitesPetxPet = [ 
            "Talk", "Play", "Walk", "Explore","Sing", "Dance", "Exercise", "Fight"
        ].map((activityName : string) => {
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

        // Environment item Activites
        this.environment.getAllItems().then((items) => {
            items.forEach(item => {
                if (item.activity && this.isActivityFeasable(item.activity)){
                    priorityList.push({
                        activity : item.activity,
                        willingness : this.willingToActivity(item.activity)})
                    }
                else {
                    console.warn("no activity on item : ", item.name)
                }
            })
        });

        // Pet x Pet Activities
        for (const activity of this.knownActivitesPetxPet) {
            if (!this.isActivityFeasable(activity)){ continue }

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


        //Does activity need partner / have capacity for partner
        var needPartner = false
        var canHavePartner = false
        selectedActivity.entityLimit.min > 1 ? needPartner = true : needPartner = false
        selectedActivity.entityLimit.max > 1 ? canHavePartner = true : canHavePartner = false

        if (needPartner && !canHavePartner){
            console.error("data is wrong for activity, min should be less than max for activity: ", selectedActivity)
            return
        } else if (!canHavePartner){
            //TODO 1 Do activity alone
            this.doActivity(selectedActivity)
            return
        }

        // partner selection and messaging (so much hinges on this "then")
        this.environment.getAllPets().then((pets) => {
            const eligiblePets = pets.filter((pet) => !pet.checkEqual(this.remoteRef))
            if (eligiblePets.length === 0) {
                console.log(`No eligible pets for ${this.name} to do activity ${selectedActivity.name}`) 
                return
            }

            var partnerPriorityList = eligiblePets.map((pet) => {
                    return {
                        item : pet,
                        weight : this.willingToActivity(selectedActivity, pet)
                    }
                })

            var selectedActivityPartner = weighted_random(partnerPriorityList)

            // HACK COMMENT if partner + activity < activity and activity can be done solo then do it solo
            // I hate everyone kinda person lol
            // later can have personality tags inside this
            var selectedActivityPartnerWeight = partnerPriorityList.find(({item, weight}) => item === selectedActivityPartner)?.weight
            var selectedActivityWeight = priorityList.find(({activity, willingness}) => activity === selectedActivity)?.willingness

            if (!selectedActivityWeight || !selectedActivityPartnerWeight){
                console.error("no activity selected or no partner selected")
            }

            // the < 5 is because the willingness is activity + partner so if partner is less than (5 more) than means we-
            // dont like the partner
            if (!needPartner && (selectedActivityPartnerWeight! -  selectedActivityWeight! < 5)){
                //TODO 2 do actvity alone
                this.doActivity(selectedActivity)
            }

            this.sendActivityRequest(selectedActivity, selectedActivityPartner).then((accepted : any) => {
                this.state = petState.idle
                if (accepted === "accept") {
                    this.doActivity(selectedActivity, selectedActivityPartner)
                } 
                else if (accepted === "not_willing"){
                    this.gotRejectedByPartner(selectedActivityPartner)
                } else {
                    //TODO 5 ask next highest rating partner
                }
            })
        })

    }

    gotRejectedByPartner(partner : VPetRemoteRef | VPUserRemoteRef){
        //TODO 3 lower friendliness
    }

    acceptActivity(activity : VPActivity, activityPartner : VPetRemoteRef | VPUserRemoteRef) : string{
        if (this.state !== petState.idle) {
            return "not_free"
        }

        if (!this.willingToActivity(activity, activityPartner)){
            return "not_willing"
        }

        this.doActivity(activity, activityPartner)
        return "accept"
    }

    doActivity(activity : VPActivity, activityPartner?: VPetRemoteRef | VPUserRemoteRef, activityItem?: VPItem){
        this.state = petState.doingActivity
        this.timeBetweenActivityInitiation = 0

        activity.entitiesInvolved.push(this.remoteRef)
        
        if (activityPartner){
            activity.entitiesInvolved.push(activityPartner)
        }

        if (activityItem){
            activity.item = activityItem
        }

        var timestamp = Date.now()
        this.activityHistory[timestamp.toString()] = {
            activity : activity,
            partner : activityPartner,
            item : activityItem,
            environment : this.environment!,
            timestamp : Date.now()
        }
        
        this.currentActivity = activity
    }

    // TODO 9 Put in brain
    // TODO 10 when fighting check opposite for partner willingness
    //Returns willingness [0,10]
    willingToActivity(activity : VPActivity, partner?: VPetRemoteRef | VPUserRemoteRef, randomness : number = 1) : number{

        var activityLike = this.relationships[activity.name]?.friendliness

        var partnerLike
        if (partner) {
            partnerLike = this.relationships[partner.uniqueId]?.friendliness
        }

        // max = 10, min = -10
        var totalLike = (activityLike ? activityLike : 0) + (partnerLike ? partnerLike : 0 )

        // HACK COMMENT : this means a solo activity is more variable to randomness than one with partner
        // add 1 randomness
        var willingness = totalLike + getRandomIntInclusive(-1*randomness, randomness)

        //normalize to 10 to -10 (i understand why gpt writes comments like this, without these i will forget what i was doing)
        willingness = ((willingness * 10 / (10 + randomness)) +10)/2

        return willingness
    }

    isActivityFeasable(activity : VPActivity) : boolean {
        for (const [statName, changeInValue] of Object.entries(activity.statAffected)) {
            var newStatValue =  this.stats[statName] + changeInValue*activity.maxTicks

            if (newStatValue > 100 && (statName in ["hunger", "boredom"])){
                return false
            }

            if ( newStatValue < 0 && (statName in ["energy"])){
                return false
            }
        }
        return true
    }


    // --------------------async methods--------------------

    async receiveActivityRequest(activity : VPActivity, activityPartner : VPetRemoteRef| VPUserRemoteRef ) : Promise<string>{
        if (activityPartner instanceof VPetRemoteRef) {
            // console.log(`${this.name} of ${this.remoteRef.serverURL} received activity request for ${activity.name} from ${activityPartner.id} of server ${activityPartner.serverURL}`)
        }
        return new Promise((resolve, reject) => {
            resolve(this.acceptActivity(activity, activityPartner))
        })
    }



    async sendActivityRequest(activity : VPActivity, activityPartner : VPetRemoteRef | VPItem | VPUserRemoteRef) : Promise<string>{
        const activityID = this.remoteRef.id + "@" + this.remoteRef.serverURL + "@" + Date.now().toString()

        return new Promise((resolve, reject) => {
            if (activityPartner instanceof VPetRemoteRef) {
                // console.log(`${this.name} of ${this.remoteRef.serverURL} is sending activity request for ${activity.name} to ${activityPartner.id} of server ${activityPartner.serverURL}`)
                this.state = petState.waitingForActivityResponse
                this.reservedForActivity = activity
                this.reservedForActivity.timeout = setTimeout(() => {
                    this.state = petState.idle
                    this.currentActivity = undefined
                    resolve("timeout")
                }, 5000)

                activityPartner.sendActivityRequest(activity, this.remoteRef, activityID).then((accepted : string) => {
                    if (this.reservedForActivity?.timeout) {
                        clearTimeout(this.reservedForActivity.timeout)
                    }
                    resolve(accepted)
                })
            } else {
                // FIXME 7 item and user activity request not implemented
                resolve("petAskedUser")
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
                this.finishActivity()
                this.currentActivity = undefined
                this.state = petState.idle
                this.activityTickTimer = -1
            }
        }
    }

    //TODO 2
    finishActivity(){
       var activtyFinished
       var activityPartner 
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
        this.tempPetView.boredom = this.stats.boredom
        this.tempPetView.stats = this.stats
        this.tempPetView.remoteRef = this.remoteRef
        this.tempPetView.activityHistory = this.activityHistory
        this.tempPetView.relationships = this.relationships

        this.tempPetView.environmentName = this.environment ? this.environment.displayName : "null"
        this.tempPetView.environmentRemoteRef = this.environment

        this.tempPetView.currentActivityName = this.currentActivity ? this.currentActivity.name : "null"

        if (this.state === petState.doingActivity && this.currentActivity) {
            this.tempPetView.currentActivityItemName = this.currentActivity.item?.name ? this.currentActivity.item?.name : "null"
            this.tempPetView.activityItem = this.currentActivity.item

            // HACK 8 assumes 1 partner
            this.currentActivity.entitiesInvolved.forEach((ent) => {
                if (ent instanceof VPetRemoteRef) {
                    if (!ent.checkEqual(this.remoteRef)) {
                        this.tempPetView.currentActivityPartnerName = ent.id
                        this.tempPetView.activityPartnerRemoteRef = ent
                        return true
                    }
                } else if (ent instanceof VPUserRemoteRef) {
                        this.tempPetView.currentActivityPartnerName = ent.id
                        return true
                }
                return true
            })
        } else {
            this.tempPetView.currentActivityPartnerName = "null"
            this.tempPetView.currentActivityItemName = "null"
        }

        
        // this.tempPetView.activityPartnerRemoteRef = this.currentActivity ? this.currentActivity.entitiesInvolved.find((ent) => {
        //     if (ent instanceof VPetRemoteRef) {
        //         return !ent.checkEqual(this.remoteRef)
        //     }
        //     return false
        // }) : undefined

        return this.tempPetView
    }

    // getHTMLView(baseUrl : string) : (children: string) => string{
    //     return (children : string) => {return petViewLayoutString(this.getView(), baseUrl, [children])}
    // }

    getRemoteRef() : VPetRemoteRef{
        this.remoteRef.id = this.name
        return this.remoteRef
    }

}

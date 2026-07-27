import { ActivityHistoryDict, createDefaultStats, VPActivity, VPRelationship, VPRelationshipDict, VPStats } from "./petRepresentation"
import { VPEntity } from "./entity"
import { VPEnvironment, VPItem, VPUser } from "./otherModels"
import { parseActivityFromName } from "./parser"
import { weighted_random, getRandomInt, getRandomIntInclusive, writeToCsvFile } from "../utils"
import {VPActivityRemoteRef, VPEnvironmentRemoteRef, VPUserRemoteRef, VPetRemoteRef} from "./remoteRefs"
import jsonData from "./data.json" 

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
    availableUserActivityNames ?: Array<string>
    ownerRemoteRef ?: VPUserRemoteRef
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
    owner ?: VPUserRemoteRef
    currentActivity ?: VPActivity
    reservedForActivity ?: VPActivityRemoteRef
    state : petState = petState.idle

    knownActivitesPetxPetNames : Array<string> = []
    timeBetweenActivityInitiation : number = 7 // HACK COMMENT

    activityTickTimer : number = -1
    perTickStatChangesDict : VPStats = {
        "hunger" : 1,
        "boredom" : 1,
        "happiness" : -1,
        "energy" : -1
    }

    activityHistory : ActivityHistoryDict = {}
    logs: { [k: string]: string } = {};
    verbose : boolean = true


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

    logging : boolean
    waitingSince : number = 0

    constructor (name : string, serverURL : string, logging : boolean = true) {
        super(name)

        this.remoteRef = new VPetRemoteRef(this.name, serverURL)

        // HACK 7 : un-hardcode this
        this.knownActivitesPetxPetNames = [ 
            "Talk", "Play", "Walk", "Explore","Sing", "Dance", "Exercise", "Fight"
        ]
        // .map((activityName : string) => {
        //     return parseActivityFromName(activityName)
        // });


        this.logging = logging
        if (this.logging) {
            setInterval(() => {
                this.logCommit()
            }, 1000)
        }
    }

    // #region ---------------------Activity Methods--------------------
    initiateActivity(){
        // TODO 4 ask user
        if (!this.environment) {
            console.log(`${this.name} is not in an environment, cannot initiate activity`)
            return
        }

        // activity selection
        var priorityList : Array<{activity : VPActivity, willingness : number}> = []

        // Environment item Activites
        this.environment.getAllItems().then((items) => {
            items.forEach(item => {
                var activity = item.getActivity()
                if (activity && this.isActivityFeasable(activity)) {
                    priorityList.push({
                        activity : activity,
                        willingness : this.willingToActivity(activity)
                    })
                }
                else {
                    console.warn("no activity on item : ", item.name)
                }
            })
        });

        // Pet x Pet Activities
        for (const activityName of this.knownActivitesPetxPetNames) {
            const activity = VPActivity.fromStringData(activityName)
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

        selectedActivity.remoteRef = undefined
        var remoteRef = selectedActivity.createRemoteRef(selectedActivity.createId(this.remoteRef.id), this.environment!.serverURL)
        selectedActivity.addEntity(this.remoteRef)
        remoteRef.addStarterEntity(this.remoteRef, selectedActivity.name)


        if (needPartner && !canHavePartner){
            console.error("data is wrong for activity, min should be less than max for activity: ", selectedActivity)
            return
        } else if (!canHavePartner){
            this.doActivity(selectedActivity)
            return
        }

        // partner selection and messaging (so much hinges on this "then" lol)
        this.environment.getAllPets().then(async (pets) => {
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
                this.doActivity(selectedActivity)
                return
            }

            // console.log(1, this.name, "->", selectedActivityPartner.id)
            this.state = petState.waitingForActivityResponse
            this.waitingSince = Date.now()
            const response = await Promise.race([
                selectedActivity.getRemoteRef()!.requestEntityToJoin(
                    this.remoteRef,
                    selectedActivityPartner
                ),
                new Promise<string>(resolve =>
                    {setTimeout(() => resolve("timeout") , 500)}
                )
            ]);
            // console.log(-1, this.name, response)
            if (response === "accept") {
                this.doActivity(selectedActivity, selectedActivityPartner);
            } else if (response === "not_willing") {
                this.state = petState.idle;
                this.gotRejectedByPartner(selectedActivityPartner);
            } else if (response === "timeout") {
                this.state = petState.idle;
                console.warn(999, `#timeout from ${this.remoteRef.id} to ${selectedActivityPartner.id} for ${selectedActivity.name}`, Date.now());
            } else {
                this.state = petState.idle;
                // TODO 7 : ask next highest rating partner
            }
        })
    }

    gotRejectedByPartner(partner : VPetRemoteRef | VPUserRemoteRef){
        //HACK COMMENT  propotion decay
        if (this.relationships[partner.uniqueId]) {
            this.relationships[partner.uniqueId].friendliness -= 0.1 - 0.02 * this.relationships[partner.uniqueId].friendliness
        } else {
            this.relationships[partner.uniqueId] = {
                otherEntity : partner,
                friendliness : -0.1
            }
        }

        if(this.logging){
            this.logRejectionByPartner(partner)
        }
    }

    acceptActivity(activity : VPActivity, activityPartner : VPetRemoteRef | VPUserRemoteRef) : string{
        // HACK COMMENT : to allow users to "interupt" pet activities
        // although since activities aren't live objects they can't be interupted for the other pet
        if (this.state !== petState.idle && activityPartner instanceof VPetRemoteRef) {
            return "not_free"
        }

        if (this.willingToActivity(activity, activityPartner) < Math.random() * 10) {
            return "not_willing"
        }

        this.doActivity(activity, activityPartner)
        return "accept"
    }

    doActivity(activity : VPActivity, activityPartner?: VPetRemoteRef | VPUserRemoteRef, activityItem?: VPItem){
        // console.log(9, this.name, activity.name, activityPartner?.id)
        this.state = petState.doingActivity
        this.timeBetweenActivityInitiation = 0

        activity.getRemoteRef()!.start()

        // activity.entitiesInvolved.push(this.remoteRef)
        
        // asking the partner should just add directly?
        if (activityPartner){
            activity.addEntity(activityPartner)
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
    willingToActivity(activity : VPActivity, partner?: VPetRemoteRef | VPUserRemoteRef, randomness : number = 0.4) : number{

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

        //normalize to 10 to -10 (i understand why gpt writes comments like this, without these i will forget what i was doing) // forgot-counter : 4
        willingness = ((willingness * 10 / (10 + randomness)) +10)/2

        return willingness
    }

    isActivityFeasable(activity : VPActivity) : boolean {
        for (const [statName, changeInValue] of Object.entries(activity.statAffected)) {
            var newStatValue =  this.stats[statName] + changeInValue*activity.maxTicks

            if (newStatValue > 100 && (statName in ["hunger", "boredom"])){
                console.log(`Activity ${activity.name} is not feasable for ${this.name} because ${statName} would exceed 100`)
                return false
            }

            if ( newStatValue < 0 && (statName in ["energy"])){
                console.log(`Activity ${activity.name} is not feasable for ${this.name} because ${statName} would go below 0`)
                return false
            }
        }
        return true
    }

    //#endregion


    // --------------------async methods--------------------

    async receiveActivityRequest(activity : VPActivity, activityPartner : VPetRemoteRef| VPUserRemoteRef ) : Promise<string>{
        return new Promise((resolve, reject) => {
            resolve(this.acceptActivity(activity, activityPartner))
        })
    }
    async environmentGetAllPets() : Promise<Array<VPetRemoteRef>>{
        if (!this.environment) {
            throw new Error(`${this.name} is not in an environment`)
        }
        const response = await this.environment.getAllPets()
        return response
    }
    async sendActivityRequest(activity : VPActivityRemoteRef, activityPartner : VPetRemoteRef | VPItem | VPUserRemoteRef) : Promise<string>{
        const activityID = this.remoteRef.id + "@" + this.remoteRef.serverURL + "@" + Date.now().toString()

        return new Promise((resolve, reject) => {
            if (activityPartner instanceof VPetRemoteRef) {
                this.state = petState.waitingForActivityResponse
                this.reservedForActivity = activity
                this.reservedForActivity.timeout = setTimeout(() => {
                    this.state = petState.idle
                    this.currentActivity = undefined
                    resolve("timeout")
                }, 5000)

                activityPartner.sendActivityRequest(activity, this.remoteRef).then((accepted : string) => {
                    if (this.reservedForActivity?.timeout) {
                        clearTimeout(this.reservedForActivity.timeout)
                    }
                    resolve(accepted)
                })
            } else {
                // TODO 7 item and user activity request not implemented
                resolve("petAskedUser")
            }
        })
    }

    async setEnvironment(environment : VPEnvironmentRemoteRef) : Promise<any>{
        this.environment = environment
        // TODO 4 logic
        var saidYes = true
        return {
            accepted : saidYes
        }
    }
    
    async setOwner(owner : VPUserRemoteRef) : Promise<any>{
        this.owner = owner
        // TODO 4 logic
        var saidYes = true
        return {
            accepted : saidYes
        }
    }

    async processActivityTick(actvityId : string, timestamp : number){
        if (!this.currentActivity || this.currentActivity.getRemoteRef()?.id !== actvityId) {
            console.error(`Activity tick received for activity ${actvityId} but current activity is ${this.currentActivity?.getRemoteRef()?.id}`)
            return
        }
        this.processStatChanges(this.currentActivity.statAffected)
    }

    async processActivityFinished(){
        this.finishActivity()
        this.currentActivity = undefined
        this.state = petState.idle
    }


    // #region ---------- logging methods ----------

    logCommit(){
        for (const [logName, logData] of Object.entries(this.logs)) {
            if (logData.length > 0) {
                writeToCsvFile(`logs/${logName}.csv`, logData)
                this.logs[logName] = ""
            }
        }
    }

    logRelationships(timestamp ?: number){
        const currentTimestamp = timestamp || Date.now()

        var relationshipsCsv = ""

        for (const [otherEntityId, relationship] of Object.entries(this.relationships)) {
            var tick_log_csv = `${currentTimestamp},${this.name},${otherEntityId},${relationship.friendliness}\n`
            relationshipsCsv += tick_log_csv
        }

        if (!this.logs["relationships"]) {
            this.logs["relationships"] = relationshipsCsv
        }
        else {
            this.logs["relationships"] += relationshipsCsv
        }
    }

    logActivityFinished(activityFinished : VPActivity, activityPartner ?: VPetRemoteRef | VPUserRemoteRef, petLikedActivity : boolean = true, timestamp ?: number){
        const finishTimestamp = timestamp || Date.now()

        var petActivityRelationship = this.relationships[activityFinished!.name]?.friendliness
        var partnerActivityRelationship = activityPartner ? this.relationships[activityPartner.uniqueId]?.friendliness : undefined
        var activityFinishedCsv = `${finishTimestamp},${this.name},${activityFinished!.name},${activityPartner ? activityPartner.uniqueId : "null"},${petLikedActivity},${petActivityRelationship ? petActivityRelationship : "null"},${partnerActivityRelationship ? partnerActivityRelationship : "null"}\n`


        if (!this.logs["activity_finished"]) {
            this.logs["activity_finished"] = activityFinishedCsv
        } else {
            this.logs["activity_finished"] += activityFinishedCsv
        }
    }

    logRejectionByPartner(partner : VPetRemoteRef | VPUserRemoteRef, timestamp ?: number){
        const rejectionTimestamp = timestamp || Date.now()
        const rejectionCsv = `${rejectionTimestamp},${this.name},${partner.id}\n`

        if (!this.logs["activity_rejection"]) {
            this.logs["activity_rejection"] = rejectionCsv
        } else {
            this.logs["activity_rejection"] += rejectionCsv
        }
    }

    // #endregion

    // #region ---------------------Tick Methods--------------------
    async tick(timestamp ?: number){
        //TODO 8 emit tick event
        // console.log(2, this.state, this.name)
        // if (this.state == petState.waitingForActivityResponse && (Date.now() - this.waitingSince >10000)) {
        //     console.warn(999, `NO #timeout from ${this.remoteRef.id} for ${this.currentActivity?.name}`, Date.now());
        //     this.state = petState.idle;
        //     this.currentActivity = undefined;
        // }


        if (this.state === petState.idle) {
            this.perTickStatChanges()
            this.processInitiations()
        } else if (this.state === petState.doingActivity) {
            // this.processActivityTick() // HACK COMMENT moved to activity remote ref, activity owns time
        }

        if (this.logging) {
            this.logRelationships(timestamp)
        }
    }

    perTickStatChanges(){
        this.processStatChanges(this.perTickStatChangesDict)

        for (const [statName, value] of Object.entries(this.relationships)) {
            this.relationships[statName].friendliness *= 0.99995
        }
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

    finishActivity(){
        // console.log(3, this.name, "finished activity", this.currentActivity?.name)
       var activityFinished = this.currentActivity
       var activityPartner = this.currentActivity?.entitiesInvolved.find((ent) => {
            if (ent instanceof VPetRemoteRef) {
                return !ent.checkEqual(this.remoteRef)
            } else if (ent instanceof VPUserRemoteRef) {
                return true
            }
        })

        // HACK 7 need non random way to determine if pet liked activity
        var petLikedActivity = this.didPetLikeActivity(activityFinished!, activityPartner!)
        
        this.updatePetLikings(activityFinished!, petLikedActivity, activityPartner)

        // if (this.logging) {
        //     this.logActivityFinished(activityFinished!, activityPartner, petLikedActivity)
        // }
    }

    didPetLikeActivity(activity : VPActivity, activityPartner : VPetRemoteRef | VPUserRemoteRef, randomness : number = 0.01) : boolean{
        // alorithm outline
        // sum the friendliness values
        // chance of liking = friendliness
        // random chance %randomness to have random outcome


        var activityFriendliness = this.relationships[activity.name]?.friendliness
        var partnerFriendliness = activityPartner ?  this.relationships[activityPartner.uniqueId]?.friendliness : undefined
        var totalFriendliness = (activityFriendliness ? activityFriendliness : 0) + (partnerFriendliness ? partnerFriendliness : 0)

        // normalize to [0,1]
        // var chanceOfLiking = (totalFriendliness + 10) / 20 
        var chanceOfLiking = 1 / (1 + Math.exp(-1 * (totalFriendliness / 2))) 
        // var chanceOfLiking = 0.5 + Math.pow(totalFriendliness/13, 3) // magic numbers came from desmos
        var petLikedActivity = Math.random() < chanceOfLiking

        if (Math.random() < randomness) {
            return Math.random() < 0.5
        } else{
            return petLikedActivity
        }
    }

    updatePetLikings(activityFinished : VPActivity, petLikedActivity : boolean, activityPartner ?: VPetRemoteRef | VPUserRemoteRef, 
        randomness : number = 0.1, 
        likedActivityFriendlinessChange : number = 0.5, dislikedActivityFriendlinessChange : number = -0.5,
        likedPartnerFriendlinessChange : number = 0.5, dislikedPartnerFriendlinessChange : number = -0.5
){

        var activityFriendliness = this.relationships[activityFinished!.name]?.friendliness
        var partnerFriendliness = activityPartner ?  this.relationships[activityPartner.uniqueId]?.friendliness : undefined

        var scale = 1 - Math.abs(activityFriendliness ? activityFriendliness-5 : 0) / 10
        var delta = petLikedActivity ? likedActivityFriendlinessChange * scale : dislikedActivityFriendlinessChange * scale

        this.relationships[activityFinished!.name] = {
            otherEntity : activityFinished,
            friendliness : this.relationships[activityFinished!.name]?.friendliness ? this.relationships[activityFinished!.name].friendliness + delta : delta
        }


        this.relationships[activityFinished!.name].friendliness = Math.max(-5, Math.min(5, this.relationships[activityFinished!.name].friendliness))

        if (activityPartner) {
        var partnerScale = 1 - Math.abs(partnerFriendliness ? partnerFriendliness-5 : 0) / 10
        var partnerDelta = petLikedActivity ? likedPartnerFriendlinessChange * partnerScale : dislikedPartnerFriendlinessChange * partnerScale

            this.relationships[activityPartner.uniqueId] = {
                otherEntity : activityPartner,
                friendliness : this.relationships[activityPartner.uniqueId]?.friendliness ?  this.relationships[activityPartner.uniqueId].friendliness + partnerDelta : partnerDelta
            }

            this.relationships[activityPartner.uniqueId].friendliness = Math.max(-5, Math.min(5, this.relationships[activityPartner.uniqueId].friendliness))  
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

    // #endregion

    // -------------View Methods--------------------
    getView() : PetView{
        this.tempPetView.boredom = this.stats.boredom
        this.tempPetView.stats = this.stats
        this.tempPetView.remoteRef = this.remoteRef
        this.tempPetView.activityHistory = this.activityHistory
        this.tempPetView.relationships = this.relationships

        this.tempPetView.availableUserActivityNames = jsonData.Activities.types.pet_user
        this.tempPetView.ownerRemoteRef = this.owner

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


    getRemoteRef() : VPetRemoteRef{
        this.remoteRef.id = this.name
        return this.remoteRef
    }

}

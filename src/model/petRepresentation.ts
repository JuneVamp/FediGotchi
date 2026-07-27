import type { VPItem } from "./otherModels"
import { parseActivityFromName } from "./parser"
import { VPEntity } from "./entity"
import { VPActivityRemoteRef, VPEnvironmentRemoteRef, VPetRemoteRef, VPUserRemoteRef } from "./remoteRefs"
import { writeToCsvFile } from "../utils"

//--------------------relationships--------------------
export interface VPRelationship{
    otherEntity : VPetRemoteRef | VPItem | VPActivity | any
    friendliness : number
}

// Likes and dislikes from [-1, 0, 1]
export interface VPRelationshipDict {
    [key : string] : VPRelationship
}



// -------------------Traits--------------------
// export class VPTrait{
//     value : number
//     constructor (value : number = 1){
//         this.value = value
//     }
// }
// export class VPPersonality{
//     neurotisim : VPTrait = new VPTrait()
// 	dominanace : VPTrait = new VPTrait()
// 	impusiveness : VPTrait = new VPTrait()
// 	extraversion : VPTrait = new VPTrait()
// 	agreeableness : VPTrait = new VPTrait()
// }

export class VPStats{
    [key: string] : number
}

export function createDefaultStats() : VPStats {
    return {
        // better at 100
        "hunger" : 0,
        "energy" : 0,
        "happiness" : 100,

        // better at 0
        "boredom" : 0,
        "stress" : 0,

        //physical
        "height" : 30,
        "weight" : 10
    }
}


// --------------------Interactions--------------------
// export interface VPEvent {
//     eventName : string,
//     statAffected ?: string,
//     personalityAffected ?: VPTrait
//     relationshipAffected ?: VPRelationship
//     changeInValue : number
// }

// export interface VPEventDict {
//     [key : string] : VPEvent
// }

// export interface VPTag {
//     tagName : string,
// }

export interface VPActivityInterface {
    name : string,
    statAffected : VPStats,
    maxTicks : number
    entitiesInvolved : Array<VPetRemoteRef | VPUserRemoteRef> 
    item ?: VPItem
    entityLimit : {min : number, max : number} 
    tags : Array<string>
    // events ?: Array<VPEvent>
}

export class VPActivity {
    // activityId : string
    name : string
    statAffected : VPStats
    maxTicks : number
    entitiesInvolved : Array<VPetRemoteRef | VPUserRemoteRef> = []
    item ?: VPItem
    entityLimit : {min : number, max : number} = {min : 1, max : 1}
    tags : Array<string> = []
    // events ?: Array<VPEvent>
    timeout ?: NodeJS.Timeout
    remoteRef ?: VPActivityRemoteRef
    numTicksDone : number = 0
    status : "active" | "finished" = "active"
    finishedCallback ?: () => void
    logToCSV : boolean = true

    constructor(activity : VPActivityInterface){
        // this.activityId = activityId
        this.name = activity.name
        this.statAffected = activity.statAffected
        this.maxTicks = activity.maxTicks
        this.entitiesInvolved = activity.entitiesInvolved
        this.entityLimit = activity.entityLimit
        this.tags = activity.tags
        // this.events = activity.events
    }

    // for activities on the same server, created from data.json with parser
    static fromStringData(activityName : string) : VPActivity{
        if (!activityName || activityName === "" || activityName === "empty") {
            return new VPActivity({
                name : "empty",
                statAffected : {},
                maxTicks : 0,
                entitiesInvolved : [],
                entityLimit : {min : 0, max : 0},
                tags : []
            });
        }
        return parseActivityFromName(activityName)
    }


    // Ideally sending this directly should be okay?
    // toJson() : any {
    //     return {
    //         name : this.name,
    //         statAffected : this.statAffected,
    //         maxTicks : this.maxTicks,
    //         // entitiesInvolved : this.entitiesInvolved,
    //         entityLimit : this.entityLimit,
    //         tags : this.tags,
    //         // events : this.events
    //     }
    // }

    static fromJson(jsonData : any) : VPActivity {
        const checkIfValidActivity = (data : any) : boolean => {
            return data && typeof data.name === "string" && typeof data.statAffected === "object" && typeof data.maxTicks === "number" ;
        }
        if (!checkIfValidActivity(jsonData)) {
            // throw new Error("Invalid activity data");
            return undefined as unknown as VPActivity; // HACK 9 to avoid breaking the server if the activity is invalid
        }
        const activity = new VPActivity({
            name: jsonData.name,
            statAffected: jsonData.statAffected,
            maxTicks: jsonData.maxTicks,
            entitiesInvolved: jsonData.entitiesInvolved || [],
            entityLimit: jsonData.entityLimit || {min: 1, max: 1},
            tags: jsonData.tags || []
        });
        return activity;
    }

    getRemoteRef() : VPActivityRemoteRef | undefined {
        return this.remoteRef || undefined
    }

    createRemoteRef(id:string, serverURL : string) : VPActivityRemoteRef {
        if(this.remoteRef) throw new Error("Activity remoteRef already exists. Cannot create a new one.")
        this.remoteRef = new VPActivityRemoteRef(id, serverURL, this.name)
        return this.remoteRef
    }

    createId(activityStarter : string) : string {
        var timestamp = Date.now().toString()
        return this.name + "_" + activityStarter + "_" + timestamp
    }

    getEntities() : Array<VPetRemoteRef | VPUserRemoteRef> {
        return this.entitiesInvolved
    }

    addEntity(entity : VPetRemoteRef | VPUserRemoteRef) : void {
        if (this.entitiesInvolved.length > this.entityLimit.max) {
            throw new Error(`Cannot add entity ${entity.id} to activity ${this.name}. Entity limit reached.`)
        }
        this.entitiesInvolved.push(entity)
    }

    // #region ----------------- async methods -----------------
    // startActivity(
    //     activityStarter : VPetRemoteRef | VPUserRemoteRef, 
    //     activityServerURL : string,
    //     // activityPartner ?: VPetRemoteRef | VPUserRemoteRef, 
    //     // activityItem ?: VPItem
    // ) : Promise<boolean> {
    //     this.status = "active"
    //     // var remoteRef = this.createRemoteRef(this.createId(activityStarter.id), activityServerURL)
    //     return this.getRemoteRef()!.addStarterEntity(activityStarter, this.name)
    // }

    async requestEntityJoin(starterEntity : VPUserRemoteRef | VPetRemoteRef, entity : VPUserRemoteRef | VPetRemoteRef) : Promise<string> {
        var remoteRef = this.getRemoteRef()
        if (!remoteRef) {throw new Error("Activity remoteRef not set. Cannot request join.")}
        const response = await remoteRef.requestEntityToJoin(starterEntity, entity)
        if (response === "accept") {
            this.entitiesInvolved.push(entity)
        }
        return response
    }

    tick(timestamp : number) : Promise<void> {
        if (this.numTicksDone >= this.maxTicks) {
            this.finished()
            return Promise.resolve()
        }

        if (this.status === "finished") {
            throw new Error("Activity is already finished. Cannot tick activity.")
            // return Promise.resolve()
        }

        this.numTicksDone += 1
        var entities = this.entitiesInvolved
        var remoteRef = this.getRemoteRef()
        if (!remoteRef) {throw new Error("Activity remoteRef not set. Cannot tick activity.")}
        return remoteRef.tick(entities)
    }

    finished() : void {
        this.status = "finished"
        this.remoteRef!.finished(this.entitiesInvolved)
        if (this.finishedCallback) {
            this.finishedCallback()
        }

        if (this.logToCSV) {
            // put timestamp, activity name, entities involved
            var csvLine = `${Date.now()},${this.name},${this.entitiesInvolved.map(entity => entity.id).join(";")}\n`
            writeToCsvFile("logs/activity_log.csv", csvLine)
        }
    }

    // #endregion
}

export interface ActivityHistory{
    activity : VPActivity, 
    partner ?: VPetRemoteRef | VPUserRemoteRef, 
    item ?: VPItem
    environment : VPEnvironmentRemoteRef, 
    timestamp : number
}

export interface ActivityHistoryDict {
    [key : string] : ActivityHistory
}

// export interface VPActivityDict {
//     [key : string] : VPActivity
// }
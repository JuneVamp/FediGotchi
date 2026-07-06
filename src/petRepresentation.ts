import { VPItem } from "./otherModels"
import { parseActivityFromName } from "./parser"
import { VPetRemoteRef, VPUserRemoteRef } from "./remoteRefs"

export class VPEntity {
    name : string 
    relationships : VPRelationshipDict = {}
    constructor (name : string) {
        this.name = name
    }
}

//--------------------relationships--------------------
export class VPRelationship{
    otherEntity : VPEntity
    friendliness : number
    constructor (ent : VPEntity, initFriendliness : number = 0){
        this.otherEntity = ent
        this.friendliness = initFriendliness
    }
}

interface VPRelationshipDict {
    [key : string] : VPRelationship
}


// -------------------Traits--------------------
export class VPTrait{
    value : number
    constructor (value : number = 1){
        this.value = value
    }
}
export class VPPersonality{
    neurotisim : VPTrait = new VPTrait()
	dominanace : VPTrait = new VPTrait()
	impusiveness : VPTrait = new VPTrait()
	extraversion : VPTrait = new VPTrait()
	agreeableness : VPTrait = new VPTrait()
}

export class VPStats{
    [key: string] : number
}

export function createDefaultStats() : VPStats {
    return {
        "hunger" : 0,
        "energy" : 0,
        "height" : 30,
        "weight" : 10,
        "boredom" : 0,
        "happiness" : 100,
        "stress" : 0
    }
}


// --------------------Interactions--------------------
export interface VPEvent {
    eventName : string,
    statAffected ?: string,
    personalityAffected ?: VPTrait
    relationshipAffected ?: VPRelationship
    changeInValue : number
}

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
    entitiesInvolved : Array<VPetRemoteRef | VPUserRemoteRef | VPItem> 
    entityLimit : {min : number, max : number} 
    tags : Array<string>
    events ?: Array<VPEvent>
}

export class VPActivity {
    activityID : string
    name : string
    statAffected : VPStats
    maxTicks : number
    entitiesInvolved : Array<VPetRemoteRef | VPUserRemoteRef | VPItem> = []
    entityLimit : {min : number, max : number} = {min : 1, max : 1}
    tags : Array<string> = []
    events ?: Array<VPEvent>
    timeout ?: NodeJS.Timeout

    constructor(activity : VPActivityInterface, activityID ?: string){
        this.activityID = activityID || activity.name + "@" + Date.now().toString()
        this.name = activity.name
        this.statAffected = activity.statAffected
        this.maxTicks = activity.maxTicks
        this.entitiesInvolved = activity.entitiesInvolved
        this.entityLimit = activity.entityLimit
        this.tags = activity.tags
        this.events = activity.events
    }

    static fromStringData(activityName : string) : VPActivity{
        if (!activityName || activityName === "" || activityName === "empty") {
            return new VPActivity({
                name : "empty",
                statAffected : {},
                maxTicks : 0,
                entitiesInvolved : [],
                entityLimit : {min : 0, max : 0},
                tags : []
            }
            );
        }
        return parseActivityFromName(activityName)
    }

    toJson() : any {
        return {
            name : this.name,
            statAffected : this.statAffected,
            maxTicks : this.maxTicks,
            // entitiesInvolved : this.entitiesInvolved,
            entityLimit : this.entityLimit,
            tags : this.tags,
            // events : this.events
        }
    }

    static fromJson(jsonData : any) : VPActivity {
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
}


// export interface VPActivityDict {
//     [key : string] : VPActivity
// }
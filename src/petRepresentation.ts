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

export interface VPTag {
    tagName : string,
}

// export interface VPActivityInterface {
//     name : string,
//     statAffected : Array<string>,
//     perTick : Array<number>,
//     maxTicks : number
//     entitiesInvolved : Array<VPEntity>
//     tags : Array<VPTag>
//     events ?: Array<VPEvent>
// }

export class VPActivity {
    name : string
    statAffected : VPStats
    maxTicks : number
    entitiesInvolved : Array<VPEntity>
    tags : Array<VPTag>
    events ?: Array<VPEvent>

    constructor(activity : VPActivity){
        this.name = activity.name
        this.statAffected = activity.statAffected
        this.maxTicks = activity.maxTicks
        this.entitiesInvolved = activity.entitiesInvolved
        this.tags = activity.tags
        this.events = activity.events
    }
}

// export interface VPActivityDict {
//     [key : string] : VPActivity
// }
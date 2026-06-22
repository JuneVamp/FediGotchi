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

export class VPStat{
    name : string
    value : number
    constructor (name : string, value : number = 0){
        this.name = name
        this.value = value
    }
}

export class VPStats{
    hunger : VPStat = new VPStat("Hunger")
    energy : VPStat = new VPStat("Energy", 0)
    height : VPStat = new VPStat("Height", 30)
    weight : VPStat = new VPStat("Weight", 10)
    boredom : VPStat = new VPStat("Boredom")
    happiness : VPStat = new VPStat("Happiness", 100)
    stress : VPStat = new VPStat("Stress")

    getAllStats() : Array<VPStat>{
        return [this.hunger, this.energy, this.height, this.weight, this.boredom, this.happiness, this.stress]
    }
}

// --------------------Interactions--------------------
export interface VPEvent {
    eventName : string,
    statAffected ?: VPStat,
    personalityAffected ?: VPTrait
    relationshipAffected ?: VPRelationship
    changeInValue : number
}

export interface VPEventDict {
    [key : string] : VPEvent
}

export interface VPTag {
    tagName : string,
}

export interface VPActivity {
    name : string,
    statAffected : Array<VPStat>,
    perTick : Array<number>,
    maxTicks : number
    tags : Array<VPTag>
    events ?: Array<VPEvent>
}

export interface VPActivityDict {
    [key : string] : VPActivity
}
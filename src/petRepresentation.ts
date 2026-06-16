import { VPActivity, VPActivityDict } from "./interactions"

interface VPRelationshipDict {
    [key : string] : VPRelationship
}

export class VPEntity {
    name : string 
    relationships : VPRelationshipDict = {}
    constructor (name : string) {
        this.name = name
    }
}

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
    value : number
    constructor (value : number = 0){
        this.value = value
    }
}

export class VPStats{
    hunger : VPStat = new VPStat()
    height : VPStat = new VPStat(30)
    weight : VPStat = new VPStat(10)
    boredom : VPStat = new VPStat()
    happiness : VPStat = new VPStat(100)
    stress : VPStat = new VPStat()
}


export class VPRelationship{
    otherEntity : VPEntity
    friendliness : number
    constructor (ent : VPEntity, initFriendliness : number = 0){
        this.otherEntity = ent
        this.friendliness = initFriendliness
    }
}

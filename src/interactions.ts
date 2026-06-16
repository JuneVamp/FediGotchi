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

export interface VPActivity {
    activityName : string,
    statAffected : VPStat,
    changeInValuePerTick : number,
    maxTicks : number
    associatedEvent ?: VPEvent
}

export interface VPActivityDict {
    [key : string] : VPActivity
}
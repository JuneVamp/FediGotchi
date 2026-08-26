import  jsonData  from "./data.json";
import { ActivityFV } from "../network/activityFV";
import { PetFV } from "../network/petFV";
import { UserFV } from "../network/userFV";
import { ItemModel } from "./itemModel";

export class ActivityModel {
    name : string
    FV ?: ActivityFV

    statAffected : { [key : string] : number}
    maxTicks : number
    entityLimit : {min : number, max : number}

    item ?: ItemModel
    entitiesInvolved ?: Array<PetFV | UserFV>

    status : "active" | "finished" = "active"
    progress : number = 0

    constructor(name : string, statAffected : { [key : string] : number }, maxTicks : number, entityLimit : {min : number, max : number}){
        this.name = name
        this.statAffected = statAffected
        this.maxTicks = maxTicks
        this.entityLimit = entityLimit
    }

    static fromStringData(activityString: string): ActivityModel | null {
        var name : string | undefined = undefined
        var activity : ActivityModel | undefined = undefined

        // TODO 7 need to test if values exist
        for (const [key, value] of Object.entries(jsonData.Activities.list)) {
            if (key === activityString) {
                name = key
                activity = new ActivityModel(name, value.statAffected, value.maxTicks, value.entityLimit)
            }
        }
        if (!name  || !activity) {
            console.error(`Activity ${activityString} not found in data.json`)
            return null
        }

        return activity
    }
}
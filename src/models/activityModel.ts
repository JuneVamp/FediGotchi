import  jsonData  from "../data/data.json";
import { ActivityFV } from "../network/activityFV";
import { PetFV } from "../network/petFV";
import { UserFV } from "../network/userFV";
import { ActivityView } from "../views/activityView";
import { ItemModel } from "./itemModel";

export class ActivityModel {
    name : string
    FV ?: ActivityFV

    statAffected : { [key : string] : number}
    maxTicks : number
    entityLimit : {min : number, max : number}

    item ?: ItemModel
    entitiesInvolved : Array<PetFV | UserFV> = []

    status : "active" | "finished" | "waitingToBeStarted" = "active"
    progress : number = 0
    finishedCallbacks : Array<() => void> = []

    constructor(name : string, statAffected : { [key : string] : number }, maxTicks : number, entityLimit : {min : number, max : number}){
        this.name = name
        this.statAffected = statAffected
        this.maxTicks = maxTicks
        this.entityLimit = entityLimit
    }


    // #region utils
    static fromStringData(activityString: string): ActivityModel | null {
        var name : string | undefined = undefined
        var activity : ActivityModel | undefined = undefined

        // FIXME  7 can cause errors
        // need to test if values exist
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

    /**
     * IMPORTANT: This should only be called if you are sure the activity exists on the remote server,
     * otherwise it will return null
     */
    static async fromFV(activityFV : ActivityFV) : Promise<ActivityModel | null> {
        const activityView = await activityFV.getView();
        if (!activityView.accepted || !activityView.activityView) {
            console.error(`Activity ${activityFV.id} not found on remote server ${activityFV.serverURL}`)
            return null
        }

        const activityData = activityView.activityView
        const activity = new ActivityModel(
            activityData.name,
            activityData.statAffected,
            activityData.maxTicks,
            activityData.entityLimit
        )
        activity.FV = activityFV

        return activity;
    }

    partnerRequirement() : {needPartner : boolean, canHavePartner : boolean} {
        var needPartner = false
        var canHavePartner = false
        this.entityLimit.min > 1 ? needPartner = true : needPartner = false
        this.entityLimit.max > 1 ? canHavePartner = true : canHavePartner = false
        return {needPartner, canHavePartner}
    }

    createFV(creator : PetFV | UserFV, serverURL : string) : ActivityFV {
        const id = `${creator.uniqueID}-${this.name}-${Date.now()}`
        const activityFV = new ActivityFV(id, serverURL)
        this.FV = activityFV
        return activityFV
    }
    // #endregion

    start() {
        if (this.status === "active") {
            console.warn(`Activity ${this.name} is already active`)
            return
        }

        this.status = "active"
    }

    addUser(userFV: UserFV) {
        this.entitiesInvolved.push(userFV)
        this.finishedCallbacks.push(() => {
            userFV.activityFinished(this.FV!)
        })
    }

    addPet(petFV: PetFV) {
        this.entitiesInvolved.push(petFV)
        this.finishedCallbacks.push(() => {
            petFV.activityFinished(this.FV!)
        })
    }

    tick() {
        if (this.progress >= this.maxTicks) {
            this.finished()
            return
        }

        if (this.status != "active") {
            console.error(`Activity ${this.name} is not active. Cannot tick.`)
            return
        }

        if (!this.FV) {
            console.error(`Activity ${this.name} has no FV. Cannot tick.`)
            return
        }

        this.progress++
        this.entitiesInvolved?.forEach(entity => {
            entity.activityTick(this.FV!)
        })
    }

    finished() {
            this.status = "finished"
            this.finishedCallbacks.forEach(callback => callback())
    }

    getView() : ActivityView {
        if (!this.FV) {
            console.warn(`Activity ${this.name} has no FV, returning view with undefined FV`)
        }

        return {
            name : this.name,
            FV : this.FV, // HACK 8 this can be undefined... shouldn't be though

            entityLimit : this.entityLimit,
            statAffected : this.statAffected,
            maxTicks : this.maxTicks,

            item : this.item?.getView(),
            entitiesInvolved : this.entitiesInvolved,

            status : this.status,
            progress : this.progress
        }
    }
}
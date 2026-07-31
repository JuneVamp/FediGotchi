import { VPEntity } from "./entity"
import { VPActivity} from "./activity"
import {parseActivityFromName, parseItemFromName} from "./parser"
import { VPUserRemoteRef } from "./remoteRefs"


export class VPGroup extends VPEntity{
    entities : Array<VPEntity> = []
    constructor (name : string){
        super(name)
    }
}

export class VPUser extends VPEntity{
    remoteRef : VPUserRemoteRef

    constructor (name : string){
        super(name)
        this.remoteRef = new VPUserRemoteRef(this.name, "")
    }

    // ----------------- async methods -----------------
    // askPetToDoActivity(pet : VPetRemoteRef, activityName : string, itemName ?: string) : Promise<boolean> {
    //     var activity = 

    //     return new Promise((resolve) => {
    //         pet.sendActivityRequest(activity, this.remoteRef).then((accepted : boolean) => {
    //             resolve(accepted)
    //         })
    //     });
    // }
}

export class VPItem {
    name : string
    available : boolean = true
    numUsers = {min : 1, max : 2}
    // activity ?: VPActivity
    activityName ?: string

    constructor(name : string, activityName ?: string){
        this.name = name
        this.activityName = activityName
    }

    static fromStringData(itemName : string) : VPItem{
        return parseItemFromName(itemName)
    }

    getActivity() : VPActivity | undefined{
        if (!this.activityName) return undefined
        const activity = parseActivityFromName(this.activityName)
        activity.item = this
        return activity
    }
}
import { VPActivity, VPEntity} from "./petRepresentation";
import jsonData from "./data.json" 
import { VPItem } from "./otherModels";

export function parseActivity(activityName : string) : VPActivity {

    var activity : VPActivity = {
        name : "-1",
        statAffected : {},
        maxTicks : -1,
        entitiesInvolved : [],
        tags : []
    }

    for (const [key, value] of Object.entries(jsonData.Activities.list)) {
        if (key === activityName) {
            activity.name = key
            activity.statAffected = value.statAffected
            activity.maxTicks = value.maxTicks
            break;
        }
    }

    if (activity.name === "-1") {
        throw new Error(`Activity ${activityName} not found in data.json`)
    }

    return activity
}

export function parseItem(itemName : string) : VPItem {
    var item : VPItem = new VPItem("-1")
    for (const [key, value] of Object.entries(jsonData.Items)) {
        if (key === itemName) {
            item.name = key
            item.activity = parseActivity(value.activity)
            break;
        } 
    }
    if (item.name === "-1") {
        throw new Error(`Item ${itemName} not found in data.json`)
    }
    return item
}
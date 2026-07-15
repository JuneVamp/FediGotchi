import { VPActivity, VPEntity} from "./petRepresentation";
import jsonData from "./data.json" 
import { VPEnvironment, VPItem } from "./otherModels";

// HACK 3 : will not get the "live version"
export function parseActivityFromName(activityName : string) : VPActivity {

    var activity : VPActivity = VPActivity.fromStringData("empty")

    // FIXME need to test if values exist
    for (const [key, value] of Object.entries(jsonData.Activities.list)) {
        if (key === activityName) {
            activity.name = key
            activity.statAffected = value.statAffected
            activity.maxTicks = value.maxTicks
            activity.entityLimit = value.entityLimit || {min : 1, max : 1}
            break;
        }
    }

    if (activity.name === "-1") {
        throw new Error(`Activity ${activityName} not found in data.json`)
    }

    return activity
}

// HACK 3 : will not get the "live version"
export function parseItemFromName(itemName : string) : VPItem {
    var item : VPItem = new VPItem("-1")

    for (const [key, value] of Object.entries(jsonData.Items.list)) {
        if (key === itemName) {
            item.name = key
            
            var activity 
            if (value.activity){ activity = parseActivityFromName(value.activity) }
            item.activity = activity

            item.activity? item.activity.item = item : ""

            break;
        }
    }

    if (item.name === "-1") {
        throw new Error(`Item ${itemName} not found in data.json`)
    }
    return item
}

// HACK 3 : will not get the "live version"
export function parseEnvironmentFromName(envName : string) : VPEnvironment {
    var env : VPEnvironment = new VPEnvironment("-1","")

    for (const [key, value] of Object.entries(jsonData.Environments.list)) {
        if (key === envName) {
            env.name = key
            env.items = value.items ? value.items.map(itemName => parseItemFromName(itemName)) : []
            break;
        }
    }

    if (env.name == "-1") {
        throw new Error(`Environment ${envName} not found in data.json`)
    }
    return env
}

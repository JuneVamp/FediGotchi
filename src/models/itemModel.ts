import { ActivityModel } from "./activityModel"
import  jsonData  from "../data/data.json";
import { ItemView } from "../views/itemView";

export class ItemModel {
    name : string
    available : boolean = true
    numUsers = {min : 1, max : 2}
    activityName ?: string

    constructor(name : string, activityName ?: string){
        this.name = name
        this.activityName = activityName
    }

    static fromStringData(itemName : string) : ItemModel | null{
        var activity : string | undefined = undefined
        var name : string | undefined = undefined

        for (const [key, value] of Object.entries(jsonData.Items.list)) {
            if (key === itemName) {
                name = key
                if (value.activity){ activity = value.activity }
                break;
            }
        }

        if (!name || !activity) {
            console.error(`Item ${itemName} not found in correct format in data.json`)
            return null
        }

        return new ItemModel(name, activity)
    }

    getActivity() : ActivityModel | undefined{
        if (!this.activityName) return undefined

        const activity = ActivityModel.fromStringData(this.activityName)
        if (!activity) return undefined

        activity.item = this
        return activity
    }

    getView(): ItemView{
        return {
            name: this.name,
            available: this.available,
            numUsers: this.numUsers,
            activityName: this.activityName
        }
    }
}
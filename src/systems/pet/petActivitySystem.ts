import jsonData from "../../data/data.json"
import { ActivityModel } from "../../models/activityModel";
import { PetModel } from "../../models/petModel";
import { ActivityFV } from "../../network/activityFV";
import { PetFV } from "../../network/petFV";
import { UserFV } from "../../network/userFV";

export class petActivityStatistics {

    activityCounts : { [key: string]: number } = {};

    statistics = {
        mostRecentActivity: undefined as string | undefined,
        mostCommonActivity: undefined as string | undefined,
        leastCommonActivity: undefined as string | undefined,
    }

    activityHistory20 : { 
        activity : ActivityFV, 
        timestamp : number, 
        partner : PetFV | UserFV | undefined
    }[] = [];

    addNewActivity(activity : ActivityFV, partner : PetFV | UserFV | undefined) {
        this.activityCounts[activity.id] = (this.activityCounts[activity.id] || 0) + 1;
        this.statistics.mostRecentActivity = activity.id;

        // Update most common activity
        let maxCount = 0;
        let mostCommonActivity: string | undefined;
        for (const [id, count] of Object.entries(this.activityCounts)) {
            if (count > maxCount) {
                maxCount = count;
                mostCommonActivity = id;
            }
        }
        this.statistics.mostCommonActivity = mostCommonActivity;

        // Update least common activity
        let minCount = Infinity;
        let leastCommonActivity: string | undefined;
        for (const [id, count] of Object.entries(this.activityCounts)) {
            if (count < minCount) {
                minCount = count;
                leastCommonActivity = id;
            }
        }
        this.statistics.leastCommonActivity = leastCommonActivity;
    }

}

export enum petActivityState {
    idle = "idle",
    doingActivity = "doingActivity",
    waitingForActivityResponse = "waitingForActivityResponse",
    reservedForActivity = "reservedForActivity"
}

export class petActivitySystem {
    awaitingActivityRejected() {
        throw new Error("Method not implemented.");
    }
    startAwaitingActivity() {
        throw new Error("Method not implemented.");
    }
    model : PetModel

    knownPetxPetActivities : Array<ActivityModel> = [];

    state : petActivityState = petActivityState.idle;
    currentActivity : ActivityModel | undefined;
    reservedActivity : ActivityModel | undefined;

    statistics : petActivityStatistics = new petActivityStatistics();

    constructor(model : PetModel){
        this.model = model;
        this.knownPetxPetActivities = jsonData.Activities.types.pet_pet.map(activityName => {
            const activity = ActivityModel.fromStringData(activityName)
            if (!activity) {
                console.error(`Activity ${activityName} not found in data.json`)
                return null
            };
            return activity
        }).filter((v : ActivityModel | null): v is ActivityModel => !!v);
    }

    // TODO 3 check activity feasability
    async getPossibleActivities() : Promise<ActivityModel[]> {
        var possibleActivities : ActivityModel[] = [];

        // activities from the items in the environment
        var env = this.model.environmentFV

        var items = await env.getItems();
        if (!items) return [];

        items.forEach(item => {
            var activity = item.getActivity();
            if (activity) {
                possibleActivities.push(activity);
            } else {
                console.warn(`Item ${item.name} does not have a valid activity`);
            }
        })

        // activities that pet knows to do without items (e.g. "play", "sleep", etc.)
        possibleActivities = possibleActivities.concat(this.knownPetxPetActivities);

        return possibleActivities;
    }

    startActivity(activity : ActivityModel, partner ?: PetFV | UserFV ) {
    }

}
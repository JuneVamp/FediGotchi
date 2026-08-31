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

/**
 * NOTE : this does NOT take care of the simulation of the activity, it only manages the state of the pet and the activity
 */
export class petActivitySystem {
    onActivityTick(activityModel: ActivityModel) : { accepted: boolean; message: string; } {
        throw new Error("Method not implemented.");
    }

    model : PetModel

    knownPetxPetActivities : Array<ActivityModel> = [];

    state : petActivityState = petActivityState.idle;
    currentActivity : ActivityModel | undefined;
    currentActivityPartner : PetFV | UserFV | undefined;

    reservedActivity : ActivityModel | undefined;
    reservedActivityPartner : PetFV | UserFV | undefined;

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

    // TODO 9 check if the transition is valid before transitoning the state
    startActivity(activity : ActivityModel, partner ?: PetFV | UserFV ) {
        this.state = petActivityState.doingActivity;
        if(!activity.FV){
            console.error(`Activity ${activity.name} does not have a valid FederationView`);
            return;
        }

        this.currentActivity = activity;
        this.currentActivityPartner = partner;
    }

    // TODO 9 check if the transition is valid before transitoning the state
    awaitActivity(activity: ActivityModel, partner: PetFV | UserFV) {
        this.state = petActivityState.waitingForActivityResponse;

        this.reservedActivity = activity;
        this.reservedActivityPartner = partner;
    }

    // TODO 9 check if the transition is valid before transitoning the state
    awaitingActivityRejected() {
        this.state = petActivityState.idle; 

        this.reservedActivity = undefined;
        this.reservedActivityPartner = undefined;
    }

    /** Starts the activity that was reserved for the pet, and clears the reserved activity and partner */
    // TODO 9 check if the transition is valid before transitoning the state
    startAwaitingActivity() {
        this.state = petActivityState.doingActivity;

        this.currentActivity = this.reservedActivity;
        this.reservedActivity = undefined;

        this.currentActivityPartner = this.reservedActivityPartner;
        this.reservedActivityPartner = undefined
    }

    // TODO 9 check if the transition is valid before transiitoning the state
    onActivityFinished(activityFV: ActivityFV) : { accepted: any; message: any; } {
        this.state = petActivityState.idle;
        this.currentActivity = undefined;
        this.currentActivityPartner = undefined;
        return { accepted: true, message: "Activity finished successfully" };
    }

    getCurrentActivity() : { activity : ActivityFV, partner : PetFV | UserFV} {
        var activityFV : ActivityFV ;
        var partnerFV : PetFV | UserFV;

        if (!this.currentActivity) {
            activityFV = new ActivityFV("","" , "");
            partnerFV = new PetFV("", "");
            console.warn(`Pet ${this.model.name} has no current activity, returning empty activity and partner`);
            return { activity : activityFV, partner : partnerFV }
        }

        if (!this.currentActivity.FV) {
            activityFV = new ActivityFV("","" , "");
            console.warn(`Pet ${this.model.name} has no current activity FV, returning empty activity`);
        } else {
            activityFV = this.currentActivity.FV;
        }

        if (!this.currentActivityPartner) {
            partnerFV = new PetFV("", "");
        } else {
            partnerFV = this.currentActivityPartner;
        }
    
        return { activity : activityFV, partner : partnerFV }
    }

}
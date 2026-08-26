import { ActivityModel } from "../../models/activityModel";
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

export class petActivitySystem {

    getPossibleActivities() : ActivityModel[] {
        return [];
    }

}
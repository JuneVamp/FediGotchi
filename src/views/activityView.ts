import { ActivityFV } from "../network/activityFV";
import { PetFV } from "../network/petFV";
import { UserFV } from "../network/userFV";
import { ItemView } from "./itemView";

export interface ActivityView {
    name : string;
    FV : ActivityFV | undefined;

    entityLimit : {min : number, max : number};
    statAffected : { [key : string] : number};
    maxTicks : number;

    item ?: ItemView;
    entitiesInvolved ?: Array<PetFV | UserFV>;

    status : "active" | "finished" | "waitingToBeStarted";
    progress : number;
}
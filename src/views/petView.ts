import { ActivityFV } from "../network/activityFV";
import { EnvironmentFV } from "../network/environmentFV";
import { PetFV } from "../network/petFV";
import { UserFV } from "../network/userFV";
import { petActivityStatistics as PetActivityStatistics } from "../systems/pet/petActivitySystem";

export interface PetView {
    name : string;
    FV : PetFV;
    imageSrc : string;

    entityRelationships : { [key : string] : number}; // pet or user uniqueID
    activityRelationships : { [key : string] : number} // activity name
    stats : { [key : string] : number};

    environmentFV : EnvironmentFV;
    activity : { activity : ActivityFV, partner : PetFV | UserFV}

    activityStatistics : PetActivityStatistics;
}
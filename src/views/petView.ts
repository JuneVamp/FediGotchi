import { ActivityFV } from "../network/activityFV";
import { EnvironmentFV } from "../network/environmentFV";
import { PetFV } from "../network/petFV";
import { UserFV } from "../network/userFV";
import { petActivityStatistics as PetActivityStatistics } from "../systems/pet/petActivitySystem";

export interface PetView {
    name : string;
    imageSrc : string;
    environmentFV : EnvironmentFV;
    activity : { activity : ActivityFV, partner : PetFV | UserFV}
    FV : PetFV;
    relationships : { [key : string] : number}; // pet or user uniqueID
    activityLikings : { [key : string] : number} // activity uniqueID
    stats : { [key : string] : number};
    activityStatistics : PetActivityStatistics;
}
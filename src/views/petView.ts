import { environmentFV } from "../network/environmentFV";
import { petFV } from "../network/petFV";
import { userFV } from "../network/userFV";

export interface PetView {
    name : string;
    imageSrc : string;
    environmentFV : environmentFV;
    activity : { name : string, partner : petFV | userFV}
    FV : petFV;
    relationships : { [key : string] : number}; // pet or user uniqueID
    activityLikings : { [key : string] : number} // activity uniqueID
}
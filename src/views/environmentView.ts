import { EnvironmentFV } from "../network/environmentFV";
import { PetFV } from "../network/petFV";

export interface environmentView {
    name : string;
    imageSrc ?: string;
    items : Array<string>;
    FV : EnvironmentFV;
    petsFV : Array<PetFV>;
} 
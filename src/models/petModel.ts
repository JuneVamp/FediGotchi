import { EnvironmentFV } from "../network/environmentFV";
import { PetFV } from "../network/petFV";

export enum petState {
    idle = "idle",
    doingActivity = "doingActivity",
    waitingForActivityResponse = "waitingForActivityResponse",
    reservedForActivity = "reservedForActivity"
}

export class PetModel {
    name : string;
    imageSrc ?: string;
    environmentFV : EnvironmentFV;
    FV : PetFV;

    constructor(name : string, environmentFV : EnvironmentFV, imageSrc ?: string){
        this.name = name;
        this.environmentFV = environmentFV;
        this.imageSrc = imageSrc;
        this.FV = new PetFV(name, environmentFV.serverURL);
    }
}

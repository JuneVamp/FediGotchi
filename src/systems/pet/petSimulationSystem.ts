import { PetModel } from "../../models/petModel";

export class petSimulationSystem {
    model : PetModel;

    constructor(model : PetModel){
        this.model = model;
    }

    stats : { [key : string] : number} = {
        "boredom" : 0,
        "hunger" : 0,
        "energy" : 100,
        "happiness" : 100,
    }

    perTickStatChangesDict = {
        "hunger" : 1,
        "boredom" : 1,
        "happiness" : -1,
        "energy" : -1
    }

    tick(){

    }

    processActivityInstanceTick(){

    }

    processActivityInstanceFinished(){

    }

    perTickStatChanges(){

    }

    processStatChanges(){

    }

    isActivityFeasable(){

    }
}
import { PetModel } from "../../models/petModel";

export class petSimulationSystem {
    model : PetModel;

    constructor(model : PetModel){
        this.model = model;
    }

    stats : { [key : string] : number} = {

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
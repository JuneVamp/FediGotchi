import { PetModel } from "../../models/petModel";

export class petRelationshipSystem {
    model : PetModel
    activityRelationshipDict : { [activityName : string] : number } = {}
    entityRelationshipDict : { [entityUniqueId : string] : number } = {}

    constructor(model : PetModel){
        this.model = model;
    }

}

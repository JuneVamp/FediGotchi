import { EnvironmentFV } from "../network/environmentFV";
import { PetFV } from "../network/petFV";
import { ItemModel } from "./itemModel";

export class EnvironmentModel {
    name : string;
    FV : EnvironmentFV;
    items : Array<ItemModel>;
    petsFV : Array<PetFV> = [];

    constructor(name : string, serverURL : string, items : Array<ItemModel>){
        this.name = name;
        this.FV = new EnvironmentFV(name, serverURL);
        this.items = items;
    }

}
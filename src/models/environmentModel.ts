import  jsonData  from "../data/data.json";
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

    static fromStringData(name : string, serverURL : string) : EnvironmentModel | null{
        var envName : string | undefined = undefined
        var environment : EnvironmentModel | undefined = undefined

        // FIXME  7 can cause errors
        // need to test if values exist
        for (const [key, value] of Object.entries(jsonData.Environments.list)) {
            if (key === envName) {
                envName = key

                var items : Array<ItemModel> = []
                if (value.items) {
                    items = value.items.map(itemName => ItemModel.fromStringData(itemName)).filter((item): item is ItemModel => item !== null)
                }

                environment = new EnvironmentModel(envName, serverURL, items)
                break;
            }
        }

        if (!envName || !environment) {
            console.error(`Environment ${name} not found in data.json`)
            return null
        }

        return environment
    }

}
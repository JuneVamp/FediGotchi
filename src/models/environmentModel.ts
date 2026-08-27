import  jsonData  from "../data/data.json";
import { EnvironmentFV } from "../network/environmentFV";
import { PetFV } from "../network/petFV";
import { environmentView } from "../views/environmentView";
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

    // NOTE : to get items, ask for items directly check FV and route for /items
    getView(): environmentView {
        return {
            name : this.name,
            items : this.items.map(item => item.name),
            FV : this.FV,
            petsFV : this.petsFV
        }
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

    getAllPetsFV(): Array<PetFV> {
        return this.petsFV
    }


    // TODO 9 : return response instead of just warn
    removePet(pet: PetFV) {
        const index = this.petsFV.findIndex(p => p.id === pet.id && p.serverURL === pet.serverURL);
        if (index !== -1) {
            this.petsFV.splice(index, 1);
        } else {
            console.warn(`Pet with id ${pet.id} and serverURL ${pet.serverURL} not found in environment ${this.name}`);
        }
    }

    // TODO 9 : return response instead of just warn
    addPet(pet: PetFV) {
        const existingPet = this.petsFV.find(p => p.id === pet.id && p.serverURL === pet.serverURL);
        if (!existingPet) {
            this.petsFV.push(pet);
        } else {
            console.warn(`Pet with id ${pet.id} and serverURL ${pet.serverURL} already exists in environment ${this.name}`);
        }
    }

}
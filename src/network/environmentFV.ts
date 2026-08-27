import { ItemModel } from "../models/itemModel";
import { getJson } from "../utils";
import { FederationView } from "./federationView";
import { PetFV } from "./petFV";

/**
 * Represents the environment remotely
 * SHOULD implement all the routes of environmentRoutes.ts except /
 */
export class EnvironmentFV extends FederationView{

    constructor(id : string, serverURL : string) {
        super(id, serverURL, "environment");
    }

    async getView() : Promise<{accepted: boolean, message: string, environmentView?: any}> {
        const response = await this.getRequest(`environments/${this.id}`);
        if (!response.accepted || !response.environmentView) {
            return {accepted: false, message: "Failed to get environment view"};
        }
        return {accepted: true, message: "Environment view retrieved", environmentView: response.environmentView};
    }

    async getPets(): Promise<Array<PetFV> | null> {
        const response = await this.getRequest(`environments/${this.id}/pets`);
        if (!response.accepted || !response.petsFV) {
            return null;
        }
        const petsFVData = response.petsFV;

        try {
            const petFVs = petsFVData.map((petData: any) => {
                const petFV = new PetFV(petData.id, this.serverURL);
                return petFV;
            }).filter((v : PetFV | null): v is PetFV => !!v);

            return petFVs;
        } catch (error) {
            console.error("Error mapping petsFV to PetFV:", error);
            return null;
        }
    }

    async getItems() : Promise<Array<ItemModel>| null> {
        const response = await this.getRequest(`environments/${this.id}/items`);
        if (!response.accepted || !response.itemViews) {
            console.error(`Failed to get items for environment ${this.id}`);
            return null;
        }
        const itemVewsData = response.itemViews;

        try {
            return itemVewsData.map((itemData: any) => new ItemModel(itemData.id, itemData.activityName ));
        } catch (error) {
            console.error("Error mapping itemViews to ItemModel:", error);
            return null;
        }
    }

    async addPet(petFV : PetFV) : Promise<{accepted : boolean, message: string}> {
        return this.postRequest(`environments/${this.id}/add-pet`, {petFV : petFV});
    }

    async removePet(petFV : PetFV) : Promise<{accepted : boolean, message: string}> {
        return this.postRequest(`environments/${this.id}/remove-pet`, {petFV : petFV});
    }

}
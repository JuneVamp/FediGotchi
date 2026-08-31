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

    async getPets(): Promise<{accepted: boolean, message: string, pets: Array<PetFV> | null}> {
        const response = await this.getRequest(`environments/${this.id}/pets`);
        if (!response.petsFV) {
            console.error(`Failed to get pets for environment ${this.id}, message: ${response.message}`);
            return {accepted: false, message: "Failed to get pets", pets: null};
        }
        const petsFVData = response.petsFV;

        try {
            const petFVs = petsFVData.map((petData: any) => {
                const petFV = new PetFV(petData.id, this.serverURL);
                return petFV;
            }).filter((v : PetFV | null): v is PetFV => !!v);

            return {accepted: true, message: "Pets retrieved", pets: petFVs};
        } catch (error) {
            console.error("Error mapping petsFV to PetFV:", error);
            return {accepted: false, message: "Failed to map pets", pets: null};
        }
    }

    async getItems() : Promise<{accepted: boolean, message:string, items: Array<ItemModel>| null}> {
        const response = await this.getRequest(`environments/${this.id}/items`);
        if (!response.itemViews) {
            console.error(`Failed to get items for environment ${this.id}, message: ${response.message}`);
            return {accepted: false, message: "Failed to get items", items: null};
        }
        const itemVewsData = response.itemViews;

        try {
            const items = itemVewsData.map((itemData: any) => new ItemModel(itemData.id, itemData.activityName ));
            return {accepted: true, message: "Items retrieved", items: items};
        } catch (error) {
            console.error("Error mapping itemViews to ItemModel:", error);
            return {accepted: false, message: "Failed to map items", items: null};
        }
    }

    async addPet(petFV : PetFV) : Promise<{accepted : boolean, message: string}> {
        return this.postRequest(`environments/${this.id}/add-pet`, {petFV : petFV});
    }

    async removePet(petFV : PetFV) : Promise<{accepted : boolean, message: string}> {
        return this.postRequest(`environments/${this.id}/remove-pet`, {petFV : petFV});
    }

}
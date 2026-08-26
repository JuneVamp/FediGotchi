import { ItemModel } from "../models/itemModel";
import { getJson } from "../utils";
import { FederationView } from "./federationView";
import { PetFV } from "./petFV";

/**
 * Represents the environment remotely
 * SHOULD implement all the routes of environmentRoutes.ts except / and /:id
 */
export class EnvironmentFV extends FederationView{

    constructor(id : string, serverURL : string) {
        super(id, serverURL, "environment");
    }

    async getPets(): Promise<Array<PetFV>> {
        const response = await fetch(`${this.serverURL}/api/environments/${this.id}/pets`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        })

        const data = await getJson(response);

        if (data) {
            try {
                const petFVs = data.petsFV.map((petData: any) => {
                    if (!petData.id){
                        console.error("Pet data does not contain an id:", petData);
                        return null;
                    }
                    const petFV = new PetFV(petData.id, this.serverURL);
                    return petFV;
                }).filter((v : PetFV | null): v is PetFV => !!v);

                return petFVs;
            } catch (error) {
                console.error("Error mapping petsFV to PetFV:", error);
                return [];
            }
        }
        return [];
    }

    async getItems() : Promise<Array<ItemModel>> {
        const response = await fetch(`${this.serverURL}/api/environments/${this.id}/items`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });

        const data = await getJson(response);

        if (data) {
            try {
                return data.itemViews.map((itemData: any) => new ItemModel(itemData.id, itemData.activityName ));
            } catch (error) {
                console.error("Error mapping itemViews to ItemModel:", error);
                return [];
            }
        }
        return [];
    }

    async addPet(petFV : PetFV) : Promise<{accepted : boolean, message: string}> {
        const response = await fetch(`${this.serverURL}/api/environments/${this.id}/add-pet`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(petFV)
        });

        const data = await getJson(response);

        if (data) {
            return {accepted : data.accepted, message : data.message};
        }

        return {accepted : false, message : "Did not receive a valid response from the server."};
    }

    async removePet(petFV : PetFV) : Promise<{accepted : boolean, message: string}> {
        const response = await fetch(`${this.serverURL}/api/environments/${this.id}/remove-pet`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(petFV)
        });

        const data = await getJson(response);

        if (data) {
            return {accepted : data.accepted, message : data.message};
        }

        return {accepted : false, message : "Did not receive a valid response from the server."}
    }


}
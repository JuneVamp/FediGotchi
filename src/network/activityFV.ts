import { getJson } from "../utils";
import { ActivityView } from "../views/activityView";
import { FederationView } from "./federationView";
import { PetFV } from "./petFV";
import { UserFV } from "./userFV";

/**
 * Represents the activity remotely
 * SHOULD implement all the routes of activityRoutes.ts except /(which does nothing)
 */
export class ActivityFV extends FederationView{

    constructor(id : string, serverURL : string) {
        super(id, serverURL, "activity");
    }

    async create(activityName : string, activityFV : ActivityFV) : Promise<{accepted: boolean, message: string}> {
        return this.postRequest(`activities/${this.id}/create`, {activityName : activityName, activityFV : activityFV});
    }

    async addPet(petFV : PetFV) : Promise<{accepted: boolean, message: string}> {
        return this.postRequest(`activities/${this.id}/add-pet`, {petFV : petFV});
    }

    async addUser(userFV : UserFV) : Promise<{accepted: boolean, message: string}> {
        return this.postRequest(`activities/${this.id}/add-user`, {userFV : userFV});
    }

    async start() : Promise<{accepted: boolean, message: string}> {
        return this.postRequest(`activities/${this.id}/start`, {});
    }

    async getView() : Promise<ActivityView | null> {
        const response = await this.getRequest(`activities/${this.id}`);
        if (!response.accepted || !response.activityView) {
            return null;
        }
        return response.activityView;
    }

}
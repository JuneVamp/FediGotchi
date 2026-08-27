import { getJson } from "../utils";
import { PetView } from "../views/petView";
import { ActivityFV } from "./activityFV";
import { EnvironmentFV } from "./environmentFV";
import { FederationView } from "./federationView";
import { UserFV } from "./userFV";

/**
 * Represents the pet remotely
 * SHOULD implement all the routes of petRoutes.ts except / and /:id
 */
export class PetFV extends FederationView{
    
    constructor(id : string, serverURL : string) {
        super(id, serverURL, "pet");
    }

    async getView() : Promise<PetView | null> {
        const response = await this.getRequest(`pets/${this.id}/view`);
        if (!response.accepted || !response.petView) {
            return null            
        }
        return response.petView as PetView;
    }

    async setEnvironment(environmentFV : EnvironmentFV) : Promise<{accepted: boolean, message: string}> {
        return this.postRequest(`pets/${this.id}/set-environment`, {environmentFV : environmentFV});
    }

    async activityRequest(activityFV : ActivityFV, partnerFV : PetFV | UserFV) : Promise<{accepted: boolean, message: string}> {
        return this.postRequest(`pets/${this.id}/activity-request`, {activityFV : activityFV, partnerFV : partnerFV});
    }

    async activityTick(activityFV : ActivityFV) : Promise<{accepted: boolean, message: string}> {
        return this.postRequest(`pets/${this.id}/activity-tick`, {activityFV : activityFV});
    }

    async activityFinished(activityFV : ActivityFV) : Promise<{accepted: boolean, message: string}> {
        return this.postRequest(`pets/${this.id}/activity-finished`, {activityFV : activityFV});
    }

}
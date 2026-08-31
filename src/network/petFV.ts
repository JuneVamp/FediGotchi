import { getJson } from "../utils";
import { PetView } from "../views/petView";
import { ActivityFV } from "./activityFV";
import { EnvironmentFV } from "./environmentFV";
import { FederationView } from "./federationView";
import { UserFV } from "./userFV";

/**
 * Represents the pet remotely
 * SHOULD implement all the routes of petRoutes.ts except /
 */
export class PetFV extends FederationView{
    
    constructor(id : string, serverURL : string) {
        super(id, serverURL, "pet");
    }

    async getView() : Promise<{accepted: boolean, message: string, petView?: PetView}> {
        const response = await this.getRequest(`pets/${this.id}`);
        if (!response.accepted || !response.petView) {
            return {accepted: false, message: "Failed to get pet view"};
        }
        // HACK this does clean the response to only take the petview,,, maybe we don't wanna do that? 
        // but I can't think of why soooo
        return {accepted: true, message: "Pet view retrieved", petView: response.petView}; 
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
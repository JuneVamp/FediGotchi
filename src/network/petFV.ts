import { ActivityFV } from "./activityFV";
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

    async setEnvironment(environmentFV : FederationView) : Promise<{accepted: boolean, message: string}> {
        return {accepted: false, message: "NOT IMPLEMENTED"};
    }

    async activityRequest(activityFV : ActivityFV, partnerFV : PetFV | UserFV) : Promise<{accepted: boolean, message: string}> {
        return {accepted: false, message: "NOT IMPLEMENTED"};
    }

    async activityTick(activityFV : ActivityFV) : Promise<{accepted: boolean, message: string}> {
        return {accepted: false, message: "NOT IMPLEMENTED"};
    }

    async activityFinished(activityFV : ActivityFV) : Promise<{accepted: boolean, message: string}> {
        return {accepted: false, message: "NOT IMPLEMENTED"};
    }
}
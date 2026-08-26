import { FederationView } from "./federationView";
import { PetFV } from "./petFV";
import { UserFV } from "./userFV";

/**
 * Represents the activity remotely
 * SHOULD implement all the routes of activityRoutes.ts except /(which does nothing) and /:id
 */
export class ActivityFV extends FederationView{

    constructor(id : string, serverURL : string) {
        super(id, serverURL, "activity");
    }

    async create(activityName : string) : Promise<{accepted: boolean, message: string}> {
        
        return {accepted: false, message: "NOT IMPLEMENTED"};
    }

    async addPet(petFV : PetFV) : Promise<{accepted: boolean, message: string}> {
        return {accepted: false, message: "NOT IMPLEMENTED"};
    }

    async addUser(userFV : UserFV) : Promise<{accepted: boolean, message: string}> {
        return {accepted: false, message: "NOT IMPLEMENTED"};
    }

    async start() : Promise<{accepted: boolean, message: string}> {
        return {accepted: false, message: "NOT IMPLEMENTED"};
    }

}
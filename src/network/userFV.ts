import { ActivityFV } from "./activityFV";
import { FederationView } from "./federationView";

export class UserFV extends FederationView{

    constructor(id : string, serverURL : string) {
        super(id, serverURL, "user");
    }

    async activityTick(activityFV : ActivityFV) : Promise<{ accepted: boolean, message: string }> {
        // TODO 10 : implement activityTick for user
        return { accepted: false, message: "activityTick not implemented for user" }
    }

    activityFinished(activityFV: ActivityFV) {
        // TODO 10 : implement activityFinished for user
        console.warn(`user activityFinished not implemented for user ${this.id} on server ${this.serverURL}`)
    }
}
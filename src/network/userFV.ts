import { FederationView } from "./federationView";

export class UserFV extends FederationView{

    constructor(id : string, serverURL : string) {
        super(id, serverURL, "user");
    }
}
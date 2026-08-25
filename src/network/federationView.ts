export class FederationView {
    id : string;
    serverURL : string;
    uniqueID : string;
    type : string;

    constructor(id : string, serverURL : string, type : string) {
        this.id = id;
        this.serverURL = serverURL;
        this.uniqueID = FederationView.createUniqueID(id, serverURL);
        this.type = type;
    }

    static createUniqueID(id : string, serverURL : string) : string {
        return `${id}@${serverURL}`;
    }

    static parseUniqueID(uniqueID : string) : {id: string, serverURL: string} {
        const [id, serverURL] = uniqueID.split("@");
        return {id, serverURL};
    }
}
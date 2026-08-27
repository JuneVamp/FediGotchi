import { getJson } from "../utils";

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

    async postRequest(endpoint : string, body : any) : Promise<{accepted: boolean, message: string}> {
        const response = await fetch(`${this.serverURL}/${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const result = await getJson(response);
        if (!result || typeof result.accepted !== "boolean" || typeof result.message !== "string") {
            return {
                accepted: false,
                message: "Invalid response from server"
            }
        }

        return result;
    }

    async getRequest(endpoint : string) : Promise<{accepted: boolean, message: string, [key: string]: any}> {
        const response = await fetch(`${this.serverURL}/${endpoint}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        
        const result = await getJson(response);
        if (!result || typeof result.accepted !== "boolean" || typeof result.message !== "string") {
            return {
                accepted: false,
                message: "Invalid response from server"
            }
        }

        return result;
    }
}
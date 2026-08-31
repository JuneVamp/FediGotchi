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
        const httpStrippedURL = serverURL.replace(/^https?:\/\//, '');
        const removeAllSLashes = httpStrippedURL.replace(/\//g, '');
        return `${id}@${removeAllSLashes}`;
    }

    static parseUniqueID(uniqueID : string) : {id: string, serverURL: string} {
        const [id, serverURL] = uniqueID.split("@");
        return {id, serverURL};
    }

    /**
     * 
     * @param endpoint The endpoint to send the POST request to, **RELATIVE** to the serverURL/api
     * @param body The body of the POST request (make sure this is consistent with the server's expected body, hightlited in routes)
     * @returns An object with the following properties:
     * - accepted: boolean indicating if the request was successful
     * - message: string containing a message from the server
     */
    async postRequest(endpoint : string, body : any) : Promise<{accepted: boolean, message: string}> {
        const response = await fetch(`${this.serverURL}/api/${endpoint}`, {
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

    /**
     *
     * @param endpoint The endpoint to send the GET request to, **RELATIVE** to the serverURL/api
     * @returns An object with the following properties:
     * - accepted: boolean indicating if the request was successful
     * - message: string containing a message from the server
     * - [key: string]: any additional properties returned by the server
     */
    async getRequest(endpoint : string) : Promise<{accepted: boolean, message: string, [key: string]: any}> {
        const response = await fetch(`${this.serverURL}/api/${endpoint}`, {
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
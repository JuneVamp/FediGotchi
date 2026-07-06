import { VPItem } from "./otherModels"
import { VPActivity } from "./petRepresentation"

export class VPEntityRemoteRef {
    id : string
    entityType : string
    serverURL : string
    constructor(id : string, entityType : string, serverURL : string){
        this.id = id
        this.entityType = entityType
        this.serverURL = serverURL
    }

    async postRequest(endpoint : string, body : any) : Promise<any> {
        // console.log("Making request to " + `${this.serverURL}/${this.entityType.toLowerCase()}s/${this.id}/${endpoint}`)
        const response = await fetch(`${this.serverURL}/${this.entityType.toLowerCase()}s/${this.id}/${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        return response.json();
    }

    async getRequest(endpoint : string) : Promise<any> {
        const response = await fetch(`${this.serverURL}/${this.entityType.toLowerCase()}s/${this.id}/${endpoint}`);
        return response.json();
    }

    // static fromJson(json : any) : VPEntityRemoteRef {
    //     return new VPEntityRemoteRef(json.id, json.entityType, json.serverURL)
    // }
}

export class VPetRemoteRef extends VPEntityRemoteRef {
    constructor(id : string, serverUrl : string){
        super(id, "pet", serverUrl)
    }

    checkEqual(other : VPetRemoteRef) : boolean {
        return this.id === other.id && this.serverURL === other.serverURL
    }

    // NOTE these methods are so i dont have to write a long swtich statement
    // instead they can be handled by the server
    async sendActivityRequest(activity : VPActivity, activityPartner : VPetRemoteRef | VPUserRemoteRef, activityID : string) : Promise<any> {
        const activityJson = activity.toJson();
        // const activityID = activityPartner.id + "@" + activityPartner.serverURL + 

        const data = await this.postRequest("activity-request", {
            activity: activityJson,
            activityPartnerType: activityPartner.entityType,
            activityPartnerId: activityPartner.id,
            activityPartnerServerUrl: activityPartner.serverURL,
            activityID: activityID
        })

        return data.accepted;
    }

    // async cancelActivityRequest(activityID : string) : Promise<any> {
    //     const data = await this.postRequest("cancel-activity-request", {
    //         activityID: activityID
    //     })
    //     return data;
    // }


    async setEnvironment(environment : VPEnvironmentRemoteRef) : Promise<any> {
        await this.postRequest("set-environment", {
            environmentId: environment.id,
            environmentServerUrl: environment.serverURL
        }).then((data : any) => { return data.success; });
    }
}

export class VPEnvironmentRemoteRef extends VPEntityRemoteRef {
    displayName : string

    constructor(id : string, serverUrl : string, displayName ?: string){
        super(id, "environment", serverUrl)
        this.displayName = displayName || id
    }

    //TODO 10 change to use the post method in VPEntityRemoteRef
    async getAllPets() : Promise<Array<VPetRemoteRef>> {
        const response = await fetch(`${this.serverURL}/environments/${this.id}/pets`);
        const data : any = await response.json();
        return data.pets.map((petData : any) => {
            return new VPetRemoteRef(petData.id, this.serverURL)
        });
    }

    async getAllItems() : Promise<Array<VPItem>> {
        const response = await fetch(`${this.serverURL}/environments/${this.id}/items`);
        const data : any = await response.json();
        return data.items.map((itemData : any) => {
            return itemData as VPItem;
            //HACK assumes itemData is directly compatiable with VPItem
        });
    }
}

export class VPUserRemoteRef extends VPEntityRemoteRef {
    constructor(id : string, serverUrl : string){
        super(id, "user", serverUrl)
    }
}

// export class VPActivityRemoteRef {
//     id : string
//     entityType : string = "VPActivity"
//     serverUrl : string
    
//     constructor(id : string, serverUrl : string){
//         this.id = id
//         this.serverUrl = serverUrl
//     }
// }
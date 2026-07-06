import { VPItem } from "./otherModels"
import { VPActivity } from "./petRepresentation"

export class VPEntityRemoteRef {
    id : string
    entityType : string
    serverUrl : string
    constructor(id : string, entityType : string, serverUrl : string){
        this.id = id
        this.entityType = entityType
        this.serverUrl = serverUrl
    }

    async postRequest(endpoint : string, body : any) : Promise<any> {
        const response = await fetch(`${this.serverUrl}/${this.entityType.toLowerCase()}s/${this.id}/${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        return response.json();
    }

    async getRequest(endpoint : string) : Promise<any> {
        const response = await fetch(`${this.serverUrl}/${this.entityType.toLowerCase()}s/${this.id}/${endpoint}`);
        return response.json();
    }
}

export class VPetRemoteRef extends VPEntityRemoteRef {
    constructor(id : string, serverUrl : string){
        super(id, "pet", serverUrl)
    }

    checkEqual(other : VPetRemoteRef) : boolean {
        return this.id === other.id && this.serverUrl === other.serverUrl
    }

    // HACK 8 why would this not accept boolean
    async sendActivityRequestToThis(activity : VPActivity, activityPartner : VPetRemoteRef | VPUserRemoteRef) : Promise<any> {
        const activityJson = activity.toJson();

        this.postRequest("activity-request", {
            activity: activityJson,
            activityPartnerId: activityPartner.id,
            activityPartnerServerUrl: activityPartner.serverUrl
        }).then((data : any) => { return data.accepted; });
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
        const response = await fetch(`${this.serverUrl}/environments/${this.id}/pets`);
        const data : any = await response.json();
        return data.pets.map((petData : any) => {
            return new VPetRemoteRef(petData.id, this.serverUrl)
        });
    }

    async getAllItems() : Promise<Array<VPItem>> {
        const response = await fetch(`${this.serverUrl}/environments/${this.id}/items`);
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
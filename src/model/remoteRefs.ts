import { VPItem } from "./otherModels"
import { PetView } from "./pet"
import { VPActivity } from "./petRepresentation"

export class VPEntityRemoteRef {
    id : string
    entityType : string
    serverURL : string
    uniqueId : string
    constructor(id : string, entityType : string, serverURL : string){
        this.id = id
        this.entityType = entityType
        this.serverURL = serverURL
        this.uniqueId = serverURL + "@"  + id
    }

    async postRequest(endpoint : string, body : any) : Promise<any> {
        const endpointString = endpoint == "" ? "" : `/${endpoint}`
        var entityTypeWithS = this.entityType.toLowerCase().charAt(this.entityType.length - 1) === "s" ? this.entityType.toLowerCase() : this.entityType.toLowerCase() + "s"
        if (entityTypeWithS === "activitys") {
            entityTypeWithS = "activities"
        }
        const response = await fetch(`${this.serverURL}/${entityTypeWithS}/${this.id}${endpointString}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        return response.json();
    }

    async getRequest(endpoint : string) : Promise<any> {
        const endpointString = endpoint == "" ? "" : `/${endpoint}`
        var entityTypeWithS = this.entityType.toLowerCase().charAt(this.entityType.length - 1) === "s" ? this.entityType.toLowerCase() : this.entityType.toLowerCase() + "s"
        if (entityTypeWithS === "activitys") {
            entityTypeWithS = "activities"
        }
        var requestUrl = `${this.serverURL}/${entityTypeWithS}/${this.id}${endpointString}`
        const response = await fetch(`${this.serverURL}/${entityTypeWithS}/${this.id}${endpointString}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        return response.json();
    }
}

export class VPetRemoteRef extends VPEntityRemoteRef {
    constructor(id : string, serverURL : string){
        super(id, "pet", serverURL)
    }

    checkEqual(other : VPetRemoteRef) : boolean {
        return this.id === other.id && this.serverURL === other.serverURL
    }

    async getView() : Promise<PetView> {
        const data = await this.getRequest("");
        return data.pet as PetView;
    }

    // NOTE these methods are so i dont have to write a long swtich statement
    // instead they can be handled by the server
    async sendActivityRequest(activity : VPActivityRemoteRef, activityPartner : VPetRemoteRef | VPUserRemoteRef) : Promise<any> {
        // const activityJson = activity.toJson();
        activity.timeout = undefined // clear timeout if it exists
        const data = await this.postRequest("activity-request", {
            activity: activity,
            activityPartnerType: activityPartner.entityType,
            activityPartnerId: activityPartner.id,
            activityPartnerServerURL: activityPartner.serverURL,
        })

        return data.accepted;
    }

    async setEnvironment(environment : VPEnvironmentRemoteRef) : Promise<any> {
        await this.postRequest("set-environment", {
            environmentId: environment.id,
            environmentServerURL: environment.serverURL
        }).then((data : any) => { return data.success; });
    }

    async setOwner(owner : VPUserRemoteRef) : Promise<any> {
        await this.postRequest("set-owner", {
            ownerId: owner.id,
            ownerServerURL: owner.serverURL
        }).then((data : any) => { return data.success; });
    }
}

export class VPEnvironmentRemoteRef extends VPEntityRemoteRef {
    displayName : string

    constructor(id : string, serverURL : string, displayName ?: string){
        super(id, "environment", serverURL)
        this.displayName = displayName || id
    }

    //TODO 10 change to use the post method in VPEntityRemoteRef
    async getAllPets() : Promise<Array<VPetRemoteRef>> {
        try {
            const response = await fetch(`${this.serverURL}/environments/${this.id}/pets`);
            const data : any = await response.json();
            return data.pets.map((petData : any) => {
                return new VPetRemoteRef(petData.id, this.serverURL)
            });
        } catch (error) {
            console.warn(`Failed to fetch pets for environment ${this.id} from ${this.serverURL}`, error)
            return []
        }
    }

    async getAllItems() : Promise<Array<VPItem>> {
        try {
            const response = await fetch(`${this.serverURL}/environments/${this.id}/items`);
            const data : any = await response.json();
            return data.items.map((itemData : any) => {
                itemData.getActivity = function() : VPActivity {
                    return itemData.activity;
                }
                return itemData as VPItem;
                //HACK assumes itemData is directly compatiable with VPItem
            });
        } catch (error) {
            console.warn(`Failed to fetch items for environment ${this.id} from ${this.serverURL}`, error)
            return []
        }
    }

    async addPet(pet : VPetRemoteRef) : Promise<any> {
        const data = await this.postRequest("add-pet", {
            petId: pet.id,
            petServerURL: pet.serverURL
        })
        return data.success;
    }
}

export class VPUserRemoteRef extends VPEntityRemoteRef {
    constructor(id : string, serverURL : string){
        super(id, "user", serverURL)
    }

    async sendActivityRequest(activity : VPActivityRemoteRef, activityPartner : VPetRemoteRef | VPUserRemoteRef) : Promise<any> {
        // const activityJson = activity.toJson();
        activity.timeout = undefined // HACK 10 to avoid timeout issues when sending activity request to user
        const data = await this.postRequest("activity-request", {
            activity: activity,
            activityPartnerType: activityPartner.entityType,
            activityPartnerId: activityPartner.id,
            activityPartnerServerURL: activityPartner.serverURL,
        })
    }


}

// TODO 1 URGENT
export class VPActivityRemoteRef extends VPEntityRemoteRef{

    entities: Array<VPetRemoteRef | VPUserRemoteRef> = []
    name : string
    timeout ?: NodeJS.Timeout // For initater to wait
    // activity ?: VPActivity


    constructor(id : string, serverURL : string, name : string){
        super(id, "activity", serverURL)
        this.name = name
    }


    /*
    * creates the activity on the server, from that server's data.json
    * adds the user/pet no matter what, this should only be called by activity starter
    */
    async addStarterEntity(VPetOrUser : VPetRemoteRef | VPUserRemoteRef, activityName : string) : Promise<any> {
        const data = await this.postRequest("add-starter-entity", {
            entityType: VPetOrUser.entityType,
            entityId: VPetOrUser.id,
            entityServerURL: VPetOrUser.serverURL,
            activityName: activityName
        })
        return data.success;
    }

    async getEntities() : Promise<Array<VPetRemoteRef | VPUserRemoteRef>> {
        const data = await this.getRequest("entities");
        return data.entities.map((entityData : any) => {
            if(entityData.entityType === "pet"){
                return new VPetRemoteRef(entityData.id, entityData.serverURL)
            } else {
                return new VPUserRemoteRef(entityData.id, entityData.serverURL)
            }
        })
    }

    /*
    * return the activity data from the server  (this is why activity needs to be on the server it exists on)
    */
    async getActivityData() : Promise<VPActivity> {
        const data = await this.getRequest("data");
        const activityFAKE = data.activity
        const activity = new VPActivity({
            name: activityFAKE.name,
            statAffected: activityFAKE.statAffected,
            maxTicks: activityFAKE.maxTicks,
            entitiesInvolved: activityFAKE.entitiesInvolved.map((entityData : any) => {
                if(entityData.entityType === "pet"){
                    return new VPetRemoteRef(entityData.id, entityData.serverURL)
                } else {
                    return new VPUserRemoteRef(entityData.id, entityData.serverURL)
                }
            }),
            entityLimit: activityFAKE.entityLimit,
            tags: activityFAKE.tags
        })
        return activity;
    }

    async requestEntityToJoin(entity: VPetRemoteRef | VPUserRemoteRef): Promise<boolean> {
        return entity.sendActivityRequest(this, entity).then((accepted : boolean) => {
            return accepted;
        })
    }

    
    async tick(entities: Array<VPetRemoteRef | VPUserRemoteRef>) : Promise<void> {
        console.log(`Activity ${this.name} ticked on server ${this.serverURL} for entities: ${entities.map(e => e.id).join(", ")}`)
        for (const entity of entities) {
            await entity.postRequest("activity-tick", {
                activityId: this.id,
                activityServerURL: this.serverURL,
                name : this.name
            });
        }
    }

    async finished(entities: Array<VPetRemoteRef | VPUserRemoteRef>) : Promise<void> {
        for (const entity of entities) {
            await entity.postRequest("activity-finished", {
                activityId: this.id,
                activityServerURL: this.serverURL,
                name : this.name
            });
        }
    }

}
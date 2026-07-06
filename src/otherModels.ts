import { VPEntity} from "./petRepresentation"
import {VPet} from "./pet"
import { VPActivity } from "./petRepresentation"
import {parseActivityFromName, parseEnvironmentFromName, parseItemFromName} from "./parser"
import { VPEnvironmentRemoteRef, VPetRemoteRef, VPUserRemoteRef } from "./remoteRefs"
import { SERVER_URL } from "./serverConfig"


export class VPGroup extends VPEntity{
    entities : Array<VPEntity> = []
    constructor (name : string){
        super(name)
    }
}

export class VPUser extends VPEntity{
    remoteRef : VPUserRemoteRef

    constructor (name : string){
        super(name)
        this.remoteRef = new VPUserRemoteRef(this.name, "")
    }

    // ----------------- async methods -----------------
    askPetToDoActivity(pet : VPetRemoteRef, activityName : string, itemName ?: string) : Promise<boolean> {
        var activity : VPActivity = VPActivity.fromStringData(activityName)
        const activityID = this.remoteRef.id + "@" + this.remoteRef.serverURL + "@" + Date.now().toString()

        return new Promise((resolve) => {
            pet.sendActivityRequest(activity, this.remoteRef, activityID).then((accepted : boolean) => {
                resolve(accepted)
            })
        });
    }
}

export class VPItem {
    name : string
    available : boolean = true
    numUsers = {min : 1, max : 2}
    activity ?: VPActivity

    constructor(name : string, activity ?: VPActivity){
        this.name = name
        this.activity = activity
    }

    static fromStringData(itemName : string) : VPItem{
        return parseItemFromName(itemName)
    }
}

export class VPEnvironment {
    name : string
    items : Array<VPItem> = []
    pets : Array<VPetRemoteRef> = []
    remoteRef : VPEnvironmentRemoteRef 

    constructor (name : string, serverUrl : string = "", items : Array<VPItem> = []){
        this.name = name
        this.items = items
        
        this.remoteRef = new VPEnvironmentRemoteRef(this.name, SERVER_URL)
    }
    
    static fromStringData(envName : string) : VPEnvironment{
        return parseEnvironmentFromName(envName)
    }

    addPet(pet : VPetRemoteRef){
        this.pets.push(pet)
        pet.setEnvironment(this.getRemoteRef())
    }

    removePet(pet : VPetRemoteRef){
        this.pets = this.pets.filter(p => p !== pet)
    }

    getAllPets() : Array<VPetRemoteRef>{
        return this.pets
    }

    addItem(item : VPItem){
        this.items.push(item)
    }

    removeItem(item : VPItem){
        this.items = this.items.filter(i => i !== item)
    }

    getAllItems() : Array<VPItem>{
        return this.items
    }


    //------------------ remote methods -----------------
    getRemoteRef() : VPEnvironmentRemoteRef{
        this.remoteRef.id = this.name
        this.remoteRef.displayName = this.name
        return this.remoteRef
    }
}
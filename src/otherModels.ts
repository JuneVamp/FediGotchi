import { VPEntity} from "./petRepresentation"
import {VPet} from "./pet"
import { VPActivity } from "./petRepresentation"
import {parseActivityFromName, parseEnvironmentFromName, parseItemFromName} from "./parser"
import { VPEnvironmentRemoteRef, VPetRemoteRef, VPUserRemoteRef } from "./remoteRefs"


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

        return new Promise((resolve) => {
            pet.sendActivityRequestToThis(activity, this.remoteRef).then((accepted : boolean) => {
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
    pets : Array<VPet> = []
    remoteRef : VPEnvironmentRemoteRef 

    constructor (name : string, serverUrl : string, items : Array<VPItem> = [], pets : Array<VPet> = []){
        this.name = name
        this.items = items
        this.pets = pets
        
        this.remoteRef = new VPEnvironmentRemoteRef(this.name, serverUrl)
    }
    
    static fromStringData(envName : string) : VPEnvironment{
        return parseEnvironmentFromName(envName)
    }

    addPet(pet : VPet){
        this.pets.push(pet)
        // TODO 2 tell the pet that it is in this environment
        // pet.environment = this
    }

    removePet(pet : VPet){
        this.pets = this.pets.filter(p => p !== pet)
    }

    getAllPets() : Array<VPet>{
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
}
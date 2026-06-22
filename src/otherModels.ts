import { VPEntity} from "./petRepresentation"
import {VPet} from "./petModel"
import { VPActivity } from "./petRepresentation"
import {parseActivity, parseItem} from "./parser"


export class VPGroup extends VPEntity{
    entities : Array<VPEntity> = []
    constructor (name : string){
        super(name)
    }
}

export class VPUser extends VPEntity{
    constructor (name : string){
        super(name)
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
        return parseItem(itemName)
    }
}

export class VPEnvironment {
    name : string
    items : Array<VPItem> = []
    pets : Array<VPet> = []

    constructor (name : string, items : Array<VPItem> = [], pets : Array<VPet> = []){
        this.name = name
        this.items = items
        this.pets = pets
    }

    addPet(pet : VPet){
        this.pets.push(pet)
        pet.environment = this
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
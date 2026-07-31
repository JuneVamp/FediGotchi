import { VPItem } from "./otherModels";
import { parseEnvironmentFromName } from "./parser";
import { VPetRemoteRef, VPEnvironmentRemoteRef } from "./remoteRefs";


export interface VPEnvironmentView {
    id: string,
    serverURL: string,
    name: string,
    items: Array<VPItem>,
    pets: Array<VPetRemoteRef>
}

export class VPEnvironment {
    name: string
    items: Array<VPItem> = [];
    pets: Array<VPetRemoteRef> = [];
    remoteRef: VPEnvironmentRemoteRef

    constructor(name: string, serverURL: string = "", items: Array<VPItem> = []) {
        this.name = name
        this.items = items

        this.remoteRef = new VPEnvironmentRemoteRef(this.name, serverURL)
    }

    static fromStringData(envName: string): VPEnvironment {
        return parseEnvironmentFromName(envName)
    }

    addPet(pet: VPetRemoteRef) {
        this.pets.push(pet)
        // pet.setEnvironment(this.getRemoteRef())
    }

    removePet(pet: VPetRemoteRef) {
        this.pets = this.pets.filter(p => p !== pet)
    }

    getAllPets(): Array<VPetRemoteRef> {
        return this.pets
    }

    addItem(item: VPItem) {
        this.items.push(item)
    }

    removeItem(item: VPItem) {
        this.items = this.items.filter(i => i !== item)
    }

    getAllItems(): Array<VPItem> {
        return this.items
    }

    getView(): VPEnvironmentView {
        var rr = this.getRemoteRef()
        return {
            id: rr.id,
            serverURL: rr.serverURL,
            name: this.name,
            items: this.items,
            pets: this.pets
        }
    }

    //------------------ remote methods -----------------
    getRemoteRef(): VPEnvironmentRemoteRef {
        this.remoteRef.id = this.name
        this.remoteRef.displayName = this.name
        return this.remoteRef
    }
}

import { VPPersonality, VPStats } from "./petRepresentation"

import { VPEntity } from "./petRepresentation"
import { VPEnvironment, VPItem } from "./otherModels"
export class VPet extends VPEntity {
    personality : VPPersonality = new VPPersonality()
    stats : VPStats = new VPStats()
    environment ?: VPEnvironment

    constructor (name : string){
        super(name)
    }

    requestActivity(){
        if (!this.environment) return

    }

    doActivity(){

    }
}
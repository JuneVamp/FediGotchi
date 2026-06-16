





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
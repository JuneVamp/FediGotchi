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
    interactable : boolean = true
    activity ?: VPActivity

    constructor(name : string, activity ?: VPActivity){
        this.name = name
        this.activity = activity
    }
}

export class VPEnvironment {
    name : string
    items : Array<VPItem> = []
    pets : Array<VPet> = []

    constructor (name : string){
        this.name = name
    }
}
export class VPEntity {
    name : string
    relationships : { [key : string] : any } = {}

    constructor (name : string) {
        this.name = name
    }
}
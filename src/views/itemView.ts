export class ItemView {
    id : string;
    name : string;
    imageSrc ?: string
    available : boolean = true
    numUsers = {min : 1, max : 2}
    activityName ?: string

    constructor(id : string,  activityName ?: string, imageSrc ?: string){
        this.id = id
        this.name = id
        this.activityName = activityName
        this.imageSrc = imageSrc
    }
}
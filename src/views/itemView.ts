export interface ItemView {
    name : string;
    imageSrc ?: string
    available : boolean 
    numUsers : {min : number, max : number}
    activityName ?: string
}
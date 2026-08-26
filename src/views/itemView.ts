export interface ItemView {
    name : string;
    imageSrc ?: string
    available : boolean 
    numUsers : {min : 1, max : 2}
    activityName ?: string
}
import { PetModel } from "../../models/petModel";
import { EventEmitter } from "../../utils";

export class PetCommunicationSystem {

    model : PetModel

    activityAcceptedEventEmitter = new EventEmitter();
    activityRejectedEventEmitter = new EventEmitter();

    constructor(model: PetModel) {
        this.model = model;
    }

    async sendActivityRequest(){

        // on accept
        this.activityAcceptedEventEmitter.emit(1);

        // on reject
        this.activityRejectedEventEmitter.emit(1);

    }

    async receiveActivityRequest(){

    }

    async createActivityInstance(){

    }

    async startActivityInstance(){

    }

    async askEnvironmentForItems(){

    }

}
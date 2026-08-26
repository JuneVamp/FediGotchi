import { PetModel } from "../../models/petModel";
import { ActivityFV } from "../../network/activityFV";
import { PetFV } from "../../network/petFV";
import { UserFV } from "../../network/userFV";
import { EventEmitter } from "../../utils";

export class petCommunicationSystem {

    model : PetModel

    constructor(model: PetModel) {
        this.model = model;
    }

    async sendActivityRequest(activityFV : ActivityFV, partner : PetFV) : Promise<{accepted: boolean, message: string}> {

        const response = await partner.activityRequest(activityFV, this.model.FV)
        const {accepted, message} = response;

        if (accepted) {
            this.model.activityAccepted();
        } else {
            if (message === "not available") {
                this.model.activityPartnerNotAvailable();
            } else if (message === "rejected") {
                this.model.activityRejected();
            }
            else {
                console.error("Unknown response from partner activity request: ", message);
                this.model.activityPartnerNotAvailable();
            }
        }

        return {accepted: false, message: "NOT IMPLEMENTED"};

    }

    async receiveActivityRequest(activityFV : ActivityFV, partner : PetFV | UserFV) : Promise<{accepted: boolean, message: string}> {

        return {accepted: false, message: "NOT IMPLEMENTED"};
    }

    async createActivityInstance(activityFV : ActivityFV) : Promise<{accepted: boolean, message: string}> {
        activityFV.create("activityName");
        return {accepted: false, message: "NOT IMPLEMENTED"}
    }

    async startActivityInstance(activityFV : ActivityFV) : Promise<{accepted: boolean, message: string}> {
        return {accepted: false, message: "NOT IMPLEMENTED"}
    }

    async askEnvironmentForItems(){

    }

}
import { ActivityModel } from "../../models/activityModel";
import { PetModel } from "../../models/petModel";
import { ActivityFV } from "../../network/activityFV";
import { PetFV } from "../../network/petFV";
import { UserFV } from "../../network/userFV";

export class petCommunicationSystem {

    model : PetModel

    constructor(model: PetModel) {
        this.model = model;
    }

    async sendActivityRequest(activityFV : ActivityFV, partner : PetFV) : Promise<{accepted: boolean, message: string}> {

        // puts a 5s timeout on the partner's response to the activity request
        const response = await Promise.race([
            partner.activityRequest(activityFV, this.model.FV),
            new Promise<{accepted: boolean, message: string}>((resolve) => {
                setTimeout(() => {
                    resolve({accepted: false, message: "timeout"});
                } , 5000); 
            })
        ]);

        const {accepted, message} = response;

        if (accepted) {
            this.model.activityAccepted();
        } else {
            this.model.deleteAwaitingActivity();
            if (message === "not available") {
                this.model.activityPartnerNotAvailable();
            } else if (message === "rejected") {
                this.model.activityRejected();
            }
            else {
                console.error("Unknown response from partner activity request, saying partner is unavailable: ", message);
                this.model.activityPartnerNotAvailable();
            }
        }

        return {accepted, message};
    }

    // async receiveActivityRequest(activityFV : ActivityFV, partner : PetFV | UserFV) : Promise<{accepted: boolean, message: string}> {
    //    return await this.model.recieveActivityRequest(activityFV, partner);
    // }

    // async createActivityInstance(activityFV : ActivityFV) : Promise<{accepted: boolean, message: string}> {
    //     activityFV.create("activityName");
    //     return {accepted: false, message: "NOT IMPLEMENTED"}
    // }

    // async startActivityInstance(activityFV : ActivityFV) : Promise<{accepted: boolean, message: string}> {
    //     return {accepted: false, message: "NOT IMPLEMENTED"}
    // }


    // async askEnvironmentForItems(){

    // }

}
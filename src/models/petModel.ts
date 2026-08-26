import { ActivityFV } from "../network/activityFV";
import { EnvironmentFV } from "../network/environmentFV";
import { PetFV } from "../network/petFV";
import { UserFV } from "../network/userFV";
import { petActivitySystem } from "../systems/pet/petActivitySystem";
import { petCommunicationSystem } from "../systems/pet/petCommunicationSystem";
import { petDecisionSystem } from "../systems/pet/petDecisionSystem";
import { petSimulationSystem } from "../systems/pet/petSimulationSystem";
import { PetView } from "../views/petView";
import { ActivityModel } from "./activityModel";

export enum petState {
    idle = "idle",
    doingActivity = "doingActivity",
    waitingForActivityResponse = "waitingForActivityResponse",
    reservedForActivity = "reservedForActivity"
}

export class PetModel {
    name : string;
    imageSrc ?: string;
    environmentFV : EnvironmentFV;
    FV : PetFV;

    // Systems
    activitySystem : petActivitySystem = new petActivitySystem(this);
    communicationSystem : petCommunicationSystem = new petCommunicationSystem(this);
    simulationSystem : petSimulationSystem = new petSimulationSystem(this);
    decisionSystem : petDecisionSystem = new petDecisionSystem(this);


    constructor(name : string, environmentFV : EnvironmentFV, imageSrc ?: string){
        this.name = name;
        this.environmentFV = environmentFV;
        this.imageSrc = imageSrc;
        this.FV = new PetFV(name, environmentFV.serverURL);
    }

    getView() : PetView {
        return {
            name : this.name,
            FV : this.FV,
            imageSrc : this.imageSrc || "",
            relationships : {},
            activityLikings : {},
            stats : {},
            environmentFV : this.environmentFV,
            activity : { 
                activity : new ActivityFV("", this.environmentFV.serverURL), 
                partner : new PetFV("", this.environmentFV.serverURL)
            },
            activityStatistics : this.activitySystem.statistics
        }
    }


    // System Management
    async getPossibleActivities() : Promise<Array<ActivityModel>> {
        const possibleActivities = await this.activitySystem.getPossibleActivities();
        return possibleActivities;
    }

    startActivity(activity : ActivityModel, partner ?: PetFV | UserFV) {
        this.activitySystem.startActivity(activity, partner);
    }

    async sendActivityRequest(activityFV : ActivityFV, partner : PetFV) : Promise<{accepted: boolean, message: string}> {
        this.activitySystem.awaitActivity(activityFV)
        return await this.communicationSystem.sendActivityRequest(activityFV, partner);
    }

    activityAccepted() {
        this.decisionSystem.onPartnerAcceptedActivity();
        this.activitySystem.startAwaitingActivity();
    }

    activityRejected() {
        this.decisionSystem.onPartnerRejectedActivity();
        this.activitySystem.awaitingActivityRejected();
    }

    activityPartnerNotAvailable() {
        this.activitySystem.awaitingActivityRejected();
    }

}

import { ActivityFV } from "../network/activityFV";
import { EnvironmentFV } from "../network/environmentFV";
import { PetFV } from "../network/petFV";
import { UserFV } from "../network/userFV";
import { petActivitySystem } from "../systems/pet/petActivitySystem";
import { petCommunicationSystem } from "../systems/pet/petCommunicationSystem";
import { petConstants } from "../systems/pet/petConstants";
import { petDecisionSystem } from "../systems/pet/petDecisionSystem";
import { petRelationshipSystem } from "../systems/pet/petRelationshipSystem";
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
    relationshipSystem : petRelationshipSystem = new petRelationshipSystem(this);
    petConstants : petConstants = new petConstants(); // HACK NOTE gives defaults values, can be overriden

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
            environmentFV : this.environmentFV,

            entityRelationships : this.getEntityRelationships(),
            activityRelationships : this.getActivityRealtionships(),
            stats : this.getStats(),
            activity : this.getCurrentActivity(),
            activityStatistics : this.activitySystem.statistics
        }
    }

    setEnvironment(environmentFV: EnvironmentFV): { accepted: boolean; message: string; } {
        this.environmentFV = environmentFV;
        return { accepted: true, message: "Environment updated successfully" };
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
        const activityModelResponse = await activityFV.getModel();
        if (!activityModelResponse.accepted || !activityModelResponse.activityModel) {
            return { accepted: false, message: "Failed to get the activity model from activity FV " + activityFV };
        }

        this.activitySystem.awaitActivity(activityModelResponse.activityModel, partner);
        return await this.communicationSystem.sendActivityRequest(activityFV, partner);
    }

    async recieveActivityRequest(activityFV : ActivityFV, partnerFV: PetFV | UserFV) : Promise<{ accepted: boolean; message: string; }> {
        const activityModelResponse = await activityFV.getModel();
        if (!activityModelResponse.accepted || !activityModelResponse.activityModel) {
            return { accepted: false, message: "Failed to get the activity model from activity FV " + activityFV };
        }
        return await this.communicationSystem.receiveActivityRequest(activityFV, partnerFV);
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

    activityFinished(activityFV: ActivityFV): { accepted: any; message: any; } {
        return this.activitySystem.onActivityFinished(activityFV);
    }

    async processActivityTick(activityFV: ActivityFV): Promise<{ accepted: boolean; message: string }> {
        const activityModelResponse = await activityFV.getModel();
        if (!activityModelResponse.accepted || !activityModelResponse.activityModel) {
            return { accepted: false, message: "Failed to get the activity model from activity FV " + activityFV };
        }

        const response = this.activitySystem.onActivityTick(activityModelResponse.activityModel);
        if (response.accepted) {
            this.simulationSystem.processStatChanges(activityModelResponse.activityModel.statAffected);
        }
        return { accepted: response.accepted, message: response.message };
    }


    getStats() : { [key : string] : number} {
        return this.simulationSystem.stats;
    }

    getCurrentActivity() : { activity : ActivityFV, partner : PetFV | UserFV} {
        return this.activitySystem.getCurrentActivity();
    }

    getActivityRealtionships(): { [activityName: string]: number } {
        return this.relationshipSystem.activityRelationshipDict;
    }

    getEntityRelationships(): { [entityUniqueId: string]: number } {
        return this.relationshipSystem.entityRelationshipDict;
    }

    updateRelationshipWithEntity(entityUniqueID: string, newValue: number) {
        this.relationshipSystem.entityRelationshipDict[entityUniqueID] = newValue;
    }

    updateRelationshipWithActivity(activityName: string, newValue: number) {
        this.relationshipSystem.activityRelationshipDict[activityName] = newValue;
    }
}

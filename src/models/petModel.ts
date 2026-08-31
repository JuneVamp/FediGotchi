import { ActivityFV } from "../network/activityFV";
import { EnvironmentFV } from "../network/environmentFV";
import { PetFV } from "../network/petFV";
import { UserFV } from "../network/userFV";
import { petActivityState, petActivitySystem } from "../systems/pet/petActivitySystem";
import { petCommunicationSystem } from "../systems/pet/petCommunicationSystem";
import { petConstants } from "../systems/pet/petConstants";
import { petDecisionSystem } from "../systems/pet/petDecisionSystem";
import { petRelationshipSystem } from "../systems/pet/petRelationshipSystem";
import { petSimulationSystem } from "../systems/pet/petSimulationSystem";
import { PetView } from "../views/petView";
import { ActivityModel } from "./activityModel";


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
    tick() {
        if (this.activitySystem.state === petActivityState.idle) {
            this.simulationSystem.tick();
        }
    }

    async getPossibleActivities() : Promise<Array<ActivityModel>> {
        const possibleActivities = await this.activitySystem.getPossibleActivities();
        return possibleActivities;
    }

    async startActivity(activity : ActivityModel, partner ?: PetFV | UserFV) {
        await activity.FV!.start();
        this.activitySystem.startActivity(activity, partner);
    }

    async deleteActivity(activity : ActivityModel) {
        await activity.FV!.delete();
    }

    async sendActivityRequest(activity : ActivityModel, partner : PetFV) : Promise<{accepted: boolean, message: string}> {
        if (!activity.FV) {
            console.error(`Activity ${activity.name} does not have an associated Federation View (FV).`);
            return { accepted: false, message: "Activity does not have an associated Federation View (FV)." };
        }

        this.activitySystem.awaitActivity(activity, partner);
        return await this.communicationSystem.sendActivityRequest(activity.FV, partner);
    }

    deleteAwaitingActivity() {
        this.activitySystem.deleteAwaitingActivity();
    }

    /** what to do when activity request is recieved */
    async recieveActivityRequest(activityFV : ActivityFV, partnerFV: PetFV | UserFV) : Promise<{ accepted: boolean; message: string; }> {
        const activityModelResponse = await activityFV.getModel();
        if (!activityModelResponse.accepted || !activityModelResponse.activityModel) {
            return { accepted: false, message: "Failed to get the activity model from activity FV " + activityFV };
        }

        if (this.activitySystem.state !== petActivityState.idle) {
            return { accepted: false, message: "not available" };
        } else {
            const response = this.decisionSystem.respondToActivityRequest(activityModelResponse.activityModel, partnerFV );
            return response;
        }
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

    tryToCallDecisionSystemFunction(functionName: string) {
        this.decisionSystem.triggerStatThresholdBasedFunction(functionName);
    }
}

import { ActivityModel } from "../models/activityModel";
import { getJson } from "../utils";
import { ActivityView } from "../views/activityView";
import { FederationView } from "./federationView";
import { PetFV } from "./petFV";
import { UserFV } from "./userFV";

/**
 * Represents the activity remotely
 * SHOULD implement all the routes of activityRoutes.ts except /(which does nothing)
 */
export class ActivityFV extends FederationView{
    name : string;

    constructor(id : string, serverURL : string, name : string) {
        super(id, serverURL, "activity");
        this.name = name;
    }

    async create() : Promise<{accepted: boolean, message: string}> {
        return this.postRequest(`activities/${this.id}/create`, {activityName : this.name, activityFV : this});
    }

    async addPet(petFV : PetFV) : Promise<{accepted: boolean, message: string}> {
        return this.postRequest(`activities/${this.id}/add-pet`, {petFV : petFV});
    }

    async addUser(userFV : UserFV) : Promise<{accepted: boolean, message: string}> {
        return this.postRequest(`activities/${this.id}/add-user`, {userFV : userFV});
    }

    async start() : Promise<{accepted: boolean, message: string}> {
        return this.postRequest(`activities/${this.id}/start`, {});
    }

    async delete() {
        return this.postRequest(`activities/${this.id}/delete`, {});
    }

    async getView() : Promise<{accepted: boolean, message: string, activityView: ActivityView | null}> {
        const response = await this.getRequest(`activities/${this.id}`);
        if (!response.accepted || !response.activityView) {
            return {accepted: false, message: "Failed to get activity view", activityView: null};
        }
        return {accepted: true, message: "Activity view retrieved", activityView: response.activityView};
    }

    async getModel() : Promise<{accepted: boolean, message: string, activityModel : ActivityModel | null}> {
        const response = await this.getView();
        const view = response.activityView;
        if (!view) {
            return {accepted: false, message: "Failed to get activity view", activityModel: null};
        }

        const activityModel = new ActivityModel(view.name, view.statAffected, view.maxTicks, view.entityLimit);
        activityModel.FV = this;
        activityModel.entitiesInvolved = view.entitiesInvolved || [];
        activityModel.status = view.status;
        activityModel.progress = view.progress;

        return {accepted: true, message: "Activity model retrieved", activityModel: activityModel};
    }

}
import { ActivityModel } from "../../models/activityModel";
import { PetModel } from "../../models/petModel";
import { PetFV } from "../../network/petFV";
import { UserFV } from "../../network/userFV";
import { weighted_random } from "../../utils";

export class petDecisionSystem {
    model : PetModel

    constructor(model : PetModel){
        this.model = model;
    }
    
    onPartnerAcceptedActivity(){

    }

    onPartnerRejectedActivity(){

    }

    updatePetRelationship(){

    }

    didPetLikeActivity(){

    }

    // TODO 3 put the willingess threshold here?
    /** make sure the pet is available when it gets here */
    respondToActivityRequest(activityModel : ActivityModel, partner : PetFV | UserFV) : {accepted: boolean, message: string} {
        if (this.willingToDoActivity(activityModel) > 0) {
            console.log(`${this.model.name} accepted the activity request for ${activityModel.name} from ${partner.id}`);

            this.model.startActivity(activityModel, partner);
            // HACK 4 fix this to be more organized
            activityModel.FV?.addPet(this.model.FV);
            
            return {accepted: true, message: "accepted"};
        }
        return {accepted: false, message: "rejected"};
    }

    // #region ACTIVITY PICKING

    // there is repetiion for activity and partner picking but 
    // they are separate because they may have different logic in the future

    /** @returns  ActivityModel from weighted random based on willingness from willingToDoActivity() function */
    pickActivityFromList(activities: ActivityModel[], partner ?: PetFV) : ActivityModel | null {
        if (activities.length === 0) {
            console.warn("No activities available to pick from.");
            return null;
        }

        var selectedActivity = weighted_random<ActivityModel>(
            activities.map(activity => {
                const willingness = this.willingToDoActivity(activity);
                return { item: activity, weight: willingness };
            })
        );

        return selectedActivity;
    }

    willingToDoActivity(activity : ActivityModel) : number {
        return 10
    }

    // TAG:SOLO
    wantToDoActivitySolo(activity : ActivityModel) : boolean {
        return this.model.petConstants.SOLO_ACTIVITY_WILLINGNESS_THRESHOLD > Math.random()
    }

    /** @returns  PetModel from weighted random based on willingness from willingnessToPickPartner() function */
    pickPartnerForActivity(partnerList : Array<PetFV>, activity ?: ActivityModel ) : PetFV | null {
        if (partnerList.length === 0) {
            console.warn("No partners available to pick from.");
            return null;
        }

        var selectedPartner = weighted_random<PetFV>(
            partnerList.map(
                partner => {
                    return {
                    item : partner,
                    weight : this.willingnessToPickPartner(partner)
                    }
                }
            )
        );

        return selectedPartner;
    }

    willingnessToPickPartner(partner : PetFV) : number {
        return 10
    }

    // #endregion


    // #region START ACTIVITY

    async tryToDoActivity(){
        const possibleActivities = await this.model.getPossibleActivities()

        var selectedActivity = this.pickActivityFromList(possibleActivities);
        if (!selectedActivity) {
            console.warn("No activity selected from possible activities.");
            return;
        }

        var {needPartner, canHavePartner} = selectedActivity.partnerRequirement();

        // signifies confirming that the pet will try to do this activity
        var activityFV = selectedActivity.createFV(this.model.FV, this.model.environmentFV.serverURL); 

        // if the activity can't have a partner, then do it solo
        // if the activity can be done solo and the pet WANTS to do it solo, then do it solo
        if ( !canHavePartner || (!needPartner && !this.wantToDoActivitySolo(selectedActivity))) {
            //HACK 4 fix this to be more organized 
            await activityFV.create();
            await activityFV.addPet(this.model.FV);

            // console.log("starting activity solo: ", selectedActivity.name);
            await this.model.startActivity(selectedActivity);
            return;
        }

        const response = await this.model.environmentFV.getPets();
        var partnerList = response.pets;
        if (!partnerList || partnerList.length === 0) {
            console.warn("No partners available in the environment.");
            return;
        }

        var selectedPartner = this.pickPartnerForActivity(partnerList, selectedActivity);
        if (!selectedPartner) {
            console.warn("No partner selected from available partners.");
            return;
        }

        // HACK 4 fix this to be more organized
        await activityFV.create();
        await activityFV.addPet(this.model.FV);

        await this.model.sendActivityRequest(selectedActivity, selectedPartner);
    }

    triggerStatThresholdBasedFunction(functionName : string) {
        if(Object.getPrototypeOf(this).hasOwnProperty(functionName)) {
            const functionToCall = (this as any)[functionName];
            if (typeof functionToCall === "function") {
                functionToCall.call(this);
            }
        }
    }

    bored_start_activity(petDecisionSystem : petDecisionSystem) {
        // HACK 2 put in model isntead of here
        if (this.model.activitySystem.state !== "idle") {
            // console.warn(`${this.model.name} is not idle and cannot start a new activity.`);
            return;
        }
        this.tryToDoActivity();
    }

    // #endregion
    
}
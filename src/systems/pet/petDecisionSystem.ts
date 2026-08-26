import { ActivityModel } from "../../models/activityModel";
import { PetModel } from "../../models/petModel";
import { PetFV } from "../../network/petFV";
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
        return false
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
        var activityFV = selectedActivity.createFV(this.model.FV, this.model.environmentFV.serverURL); // signifies confirming that the pet will try to do this activity

        // if the activity can't have a partner, then do it solo
        // if the activity can be done solo and the pet WANTS to do it solo, then do it solo
        if ( !canHavePartner || (!needPartner && !this.wantToDoActivitySolo(selectedActivity))) {
            this.model.startActivity(selectedActivity);
            return;
        }

        const partnerList = await this.model.environmentFV.getPets();
        if (!partnerList || partnerList.length === 0) {
            console.warn("No partners available in the environment.");
            return;
        }

        var selectedPartner = this.pickPartnerForActivity(partnerList, selectedActivity);
        if (!selectedPartner) {
            console.warn("No partner selected from available partners.");
            return;
        }

        this.model.sendActivityRequest(selectedActivity.FV!, selectedPartner);
    }

    // triggers when certain stat reaches certain thresholds
    triggerStatLow(stat: string, value: number) {

        switch(stat) {
            case "boredom":
                if(value < 20) {
                    this.petIsBored();
                }
                break;
            case "hunger":
                if(value < 20) {
                    this.petIsHungry();
                }
                break;
            case "energy":
                if(value < 20) {
                    this.petIsLowEnergy();
                }
                break;
            case "happiness":
                if(value < 20) {
                    this.petIsUnhappy();
                }
                break;
        }

    }

    petIsBored() {
    }

    petIsHungry() {

    }

    petIsLowEnergy() {

    }

    petIsUnhappy() {

    }

    // #endregion
    
}
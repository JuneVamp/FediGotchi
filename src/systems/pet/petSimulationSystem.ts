import { ActivityModel } from "../../models/activityModel";
import { PetModel } from "../../models/petModel";

export class petSimulationSystem {
    model : PetModel;

    tickCount : number = 0;

    constructor(model : PetModel){
        this.model = model;
    }

    stats : { [key : string] : number} = {
        "boredom" : 0,
        "hunger" : 0,
        "energy" : 100,
        "happiness" : 100,
    }


    /** NOTE should only trigger when not doing an activity */
    tick(){
        this.tickCount++;
        this.perTickStatChanges();
    }


    perTickStatChanges(){
        this.processStatChanges(this.model.petConstants.PER_TICK_STAT_CHANGES)

        for (const [activityName, value] of Object.entries(this.model.getActivityRealtionships())) {
            this.model.updateRelationshipWithActivity(
                activityName, (1 - this.model.petConstants.ACTIVITY_RELATIONSHIP_DECAY_PER_TICK)
            );
        }

        for (const [entityUniqueId, value] of Object.entries(this.model.getEntityRelationships())) {
            this.model.updateRelationshipWithEntity(
                entityUniqueId, (1 - this.model.petConstants.ENTITY_RELATIONSHIP_DECAY_PER_TICK)
            );
        }
    }

    // HACK 10 maybe it should return a new object instead of changign the existing one
    processStatChanges(statChanges : { [key : string] : number}){

        for (const [statName, changeInValue] of Object.entries(statChanges)) {
            if (this.stats.hasOwnProperty(statName)) {
                this.stats[statName] += changeInValue
            } else {
                console.warn(`Stat ${statName} does not exist on ${this.model.name}. Ignoring stat change.`)
            }
        }

        // clamp
        for (const [statName, value] of Object.entries(this.stats)) {
            if (value < 0) {
                this.stats[statName] = 0
            } else if (value > 100) {
                this.stats[statName] = 100
            }
        }

        // test for stat thresholds
        for (const [functionName, statThresholds] of Object.entries(this.model.petConstants.STAT_THRESHOLDS)) {
            var callFunction = true
            for (const [statName, thresholds] of Object.entries(statThresholds)) {
                if (this.stats.hasOwnProperty(statName)) {
                    const statValue = this.stats[statName];

                    if (thresholds.low !== undefined && statValue > thresholds.low) {
                        callFunction = false;
                    }

                    if (thresholds.high !== undefined && statValue < thresholds.high) {
                        callFunction = false;
                    }
                }
            }

            if (callFunction) {
                this.model.tryToCallDecisionSystemFunction(functionName);
            }
        }

    }

    isActivityFeasable(){

    }

    // processActivityInstanceTick(activityModel : ActivityModel){

    // }

    // processActivityInstanceFinished(){

    // }
}
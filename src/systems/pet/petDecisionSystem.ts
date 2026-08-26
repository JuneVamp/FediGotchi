export class petDecisionSystem {
    
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
    
}
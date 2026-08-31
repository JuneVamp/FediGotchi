import { PetModel } from "./models/petModel";
import { EnvironmentModel } from "./models/environmentModel";
import { ActivityModel } from "./models/activityModel";

import jsonData from "./data/data.json"

export class Simulation {
    NUM_INITIAL_PETS = 20;
    NUM_INITIAL_ENVIRONMENTS = 3;

    // users = new Map<string, UserModel>()
    pets = new Map<string, PetModel>()
    environments = new Map<string, EnvironmentModel>()
    activities = new Map<string, ActivityModel>()

    serverURL: string;

    simulationTickInterval: number = 1000; // in milliseconds
    simulationTicker : NodeJS.Timeout | undefined = undefined;

    constructor(serverURL: string) {
        this.serverURL = serverURL;
    }

    initializeEnvironments(){
    // HACK 10 this is why we need server URL in config
    // otherwise we should be able to get it from request headers, but that is not reliable.....yet
        for (var i = 0; i < this.NUM_INITIAL_ENVIRONMENTS; i++) {
            const environmentList = jsonData.Environments.all;
            var env = EnvironmentModel.fromStringData(environmentList[i % environmentList.length], this.serverURL);
            if (env){
                this.environments.set(env.name, env);
            }
        }
    }

    /**
     * create NUM_INITIAL_PETS pets with based on images in public/assets/images/beings
     */
    initializePets(){
        // creating pets from images in public/assets/images/beings
        var fs = require('fs');
        var path = require('path');
        var petImagesPath = path.join(__dirname, '../public/assets/images/beings');
        var petImageFiles = fs.readdirSync(petImagesPath).filter((file : string) => file.endsWith('.png'));
        // var randomPetImageFiles = petImageFiles.sort(() => 0.5 - Math.random()).slice(0, 6);
        var randomPetImageFiles = petImageFiles.slice(0, this.NUM_INITIAL_PETS);
        randomPetImageFiles.forEach((file : string) => {
            var envIndex = Math.floor(Math.random() * this.environments.size);

            var petName = file.replace('.png', '');
            var pet = new PetModel(
                petName, 
                this.environments.get(Array.from(this.environments.keys())[envIndex])!.FV,
                `/assets/images/beings/${file}`);
            this.pets.set(pet.name, pet);
        });
    }

    startSimulationTicker() {
        this.simulationTicker = setInterval(() => {
            try {
                this.pets.forEach(pet => {
                    pet.tick();
                });
            } catch (error) {
                console.error("Error during simulation tick:", error);
            }

            try {
                this.activities.forEach(activity => {
                    activity.tick();
                });
            } catch (error) {
                console.error("Error during activity tick:", error);
            }
        }, this.simulationTickInterval);
    }
}  
// #region utils
function getValidJson(obj){
    try {
        return obj.json();
    } catch (e) {
        console.log("Invalid JSON: ", e);
        return {};
    }
}

function getValidId(idOrUniqueId){
    if (idOrUniqueId.includes("@")) {
        return idOrUniqueId.split("@")[1];
    } else if (idOrUniqueId.includes("-VP_UNIQUE_ID-")) {
        return idOrUniqueId.split("-VP_UNIQUE_ID-")[1];
    }
    return idOrUniqueId;
}

// #endregion
//#region base

/** 
 *  Only works if the server is not running in a directory
 *  Helper if called after setBaseURL()
 *  @returns {string} base URL for this server
 */
function getBaseURL(){
    if (window.baseURL) return window.baseURL;
    return window.location.origin;
}

/**
 * Sets the base URL for the API endpoints
 * @param {string} url - The base URL for the API
 */
function setBaseURL(url){
    window.baseURL = url;
}

//#endregion



//#region pets

/**
 * NOTE: expects the server to provide json
 * @param {string} petId
 * @param {string} petServer - if the pet is from a different server, defaults to getBaseURL()
 * @returns {Promise<PetView>} - The pet view object (refer to src/model/pet.ts)
*/
async function getPetView(petId, petServer = getBaseURL()){
    if (!petId) throw new Error("petId is required");
    const petView = await fetch(petServer + "/pets/" + getValidId(petId),{
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return getValidJson(petView);
}


/**
 * @param {string} petId 
 * @param {activityRequest} activityRequest check src/model/activity.ts for type definition
 * @param {string} petServer if the pet is from a different server, defaults to getBaseURL()
 * @returns {Promise<{message: string, accepted: boolean}>}
 */
async function sendActivityRequestToPet(petId, activityRequest, petServer = getBaseURL()){
    if (!petId) throw new Error("petId is required");
    if (!activityRequest) throw new Error("activity is required");
    const response = await fetch(petServer + "/pets/" + getValidId(petId) + "/activity-request", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            activity: activityRequest.activity,
            activityPartnerType: activityRequest.activityPartnerType,
            activityPartnerId: activityRequest.activityPartnerId,
            activityPartnerServerURL: activityRequest.activityPartnerServerURL
        })
    });
    return getValidJson(response);
}


// TODO 2 pet -> environment instead of the other way round in app route
/**
 * @param {string} petId 
 * @param {environmentId : string, environmentServerURL : string} environment the env you want to move this pet to
 * @param {string} petServer if the pet is from a different server, defaults to getBaseURL()
 */
async function setPetEnvironment(petId, environment, petServer = getBaseURL()) {
    if (!petId) throw new Error("petId is required");
    if (!environment || !environment.id || !environment.serverURL) throw new Error("environment is required and must have id and serverURL");
    const response = await fetch(petServer + "/pets/" + getValidId(petId) + "/set-environment", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ environment: environment })
    });
    return getValidJson(response);
}

async function addPetToActivityOnServer(activityId, pet, serverURL = getBaseURL()){
    if (!activityId) throw new Error("activityId is required");
    if (!pet || !pet.id || !pet.serverURL) throw new Error("pet is required and must have id and serverURL");
    const response = await fetch(serverURL + "/activities/" + activityId + "/add-entity", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            entityType: "pet",
            entityId: pet.id,
            entityServerURL: pet.serverURL
        })
    });
    return getValidJson(response);
}

//#endregion



//#region environments

/**
 * returns a view including items and remote refernces to pets
 * @param {string} environmentId 
 * @param {string} environmentServer if the environment is from another server, defaults to getBaseURL()
 * @returns {Promise<VPEnvironmentView>} - The environment view object (refer to src/model/environment.ts)
 */
async function getEnvironmentView(environmentId, environmentServer = getBaseURL()){
    if (!environmentId) throw new Error("environmentId is required");
    const environmentView = await fetch(environmentServer + "/environments/" + environmentId,{
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return environmentView.json();
}

//#endregion



//#region activities


/**
 * 
 * @param {id:string, name:string, serverURL:string} activity 
 * @param {id:string} user 
 * @param {string} serverURL // the server where the user is located, defaults to getBaseURL()
 * @returns 
 */
async function createActivityOnServerUser(activity, user, serverURL = getBaseURL()){
    if (!activity) throw new Error("activity is required");
    const response = await fetch(activity.serverURL + "/activities/" + activity.id + "/add-starter-entity", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            activityName: activity.name,
            entityType: "user",
            entityId: user.id,
            entityServerURL: serverURL
        })
    });
    return getValidJson(response);
}

//#endregion



// #region users

/**
 * 
 * @param {string} serverURL ideally you shouldn't have to give this in the current log in model
 * @returns 
 */
async function getCurrentUser(serverURL = getBaseURL()){
    const response = await fetch(serverURL + "/current-user", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const data = await getValidJson(response);
    if (data && data.username) {
        return data.username;
    } else {
        return null;
    }
}

// #endregion
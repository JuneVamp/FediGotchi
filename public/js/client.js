
// // source: https://www.geeksforgeeks.org/javascript/how-to-get-cookie-by-name-in-javascript/
// function getCookieByName(name) {
//   const cookies = document.cookie.split(";");
//   for (let cookie of cookies) {
//     cookie = cookie.trim();
//     if (cookie.startsWith(name + "=")) {
//       return cookie.substring(name.length + 1);
//     }
//   }
//   return null;
// }


async function userAskPetToDoActivity(petName , activityName, baseURL) {
    console.log(`User is asking pet ${petName} to do activity ${activityName}`);
    const activityID = "user_" + activityName + "_" + Date.now(); 
    const username = await getCurrentUser();
    const activityRequest = {
        activity: {
            id: activityID,
            name: activityName,
            serverURL: baseURL
        },
        activityPartnerType: "user",
        activityPartnerId: username,
        activityPartnerServerURL: baseURL
    }

    await createActivityOnServerUser({id: activityID, name: activityName, serverURL: baseURL}, {id: username}, baseURL);
    const response = await sendActivityRequestToPet(petName, activityRequest, baseURL)
    if (response.accepted === "accept"){
        await addPetToActivityOnServer(activityID, {id: petName, serverURL: baseURL}, baseURL);
    }
};

async function userSelectEnvironment(environmentRemoteRef, petName, baseURL) {
    console.log(`User is asking pet ${petName} to move to environment ${environmentRemoteRef.id} at ${environmentRemoteRef.serverURL}, with baseURL ${baseURL}`);
    const response = await setPetEnvironment(petName, {id: environmentRemoteRef.id, serverURL: environmentRemoteRef.serverURL}, baseURL);

    console.log(response);
}

function userMovePetToNewEnvironment(petName, baseURL) {
    console.log("base url: " + baseURL);
    console.log(`User is asking pet ${petName} to move to a new environment`);
    const environments = JSON.parse(localStorage.getItem("environments") ?? "[]");

    const environmentHtml = document.querySelector(".environment-select-popup")?.remove();

    const environmentSelectorPopup = document.createElement("div");
    environmentSelectorPopup.className = "environment-select-popup";
    environmentSelectorPopup.innerHTML = `
         <div class="environment-select-window">
            <h2>Select Environment</h2>
            <div class="manual-environment">
                <input
                    type="text"
                    class="manual-environment-url"
                    placeholder="Paste environment URL..."
                >
                <button class="manual-add-button">Move</button>
            </div>
            <div class="environment-list">
                ${environments.map(env => `
                    <div class="environment-row">
                        <div class="environment-info">
                            <strong>${env.id}</strong><br>
                            <small>${env.remoteRef.serverURL ?? ""}</small>
                        </div>

                        <button class="move-button"
                            data-id="${env.id}" 
                            data-server="${env.remoteRef.serverURL ?? ""}"
                            >
                            Move Here
                        </button>
                    </div>
                `).join("")}
            </div>

            <button class="cancel-button">Cancel</button>
        </div>
    `;
    document.body.appendChild(environmentSelectorPopup);

    environmentSelectorPopup.querySelector(".cancel-button").addEventListener("click", () => {
        environmentSelectorPopup.remove();
    });

    environmentSelectorPopup.querySelector(".manual-add-button")
    .addEventListener("click", async () => {
        const input = environmentSelectorPopup.querySelector(".manual-environment-url");
        const url = input.value.trim();

        if (!url) return;

        try {
            const parsed = new URL(url);

            const parts = parsed.pathname.split("/").filter(Boolean);
            const environmentIndex = parts.lastIndexOf("environments");
            console.log("environmentIndex: " + environmentIndex);

            if (environmentIndex === -1 || environmentIndex === parts.length - 1) {
                alert("Invalid environment URL");
                return;
            }

            const environmentId = parts[environmentIndex + 1];

            const serverURL =
                parsed.origin +
                "/" +
                parts.slice(0, environmentIndex).join("/");

            await userSelectEnvironment(
                {
                    id: environmentId,
                    serverURL
                },
                petName,
                baseURL
            );

            environmentSelectorPopup.remove();
        } catch {
            alert("Invalid URL");
        }
    });

    const moveButtons = environmentSelectorPopup.querySelectorAll(".move-button");
    moveButtons.forEach(button => {
        button.addEventListener("click", async (event) => {
            const selectedEnvironmentId = event.target.dataset.id;
            const selectedEnvironmentServerURL = event.target.dataset.server;
            await userSelectEnvironment({ id: selectedEnvironmentId, serverURL: selectedEnvironmentServerURL }, petName, baseURL);
            environmentSelectorPopup.remove();
        });
    });
}

function refreshPetView(petName , baseURL) {
    const refreshPetViewOnce = async (petName , baseURL ) => {
        const data = await getPetView(petName, baseURL);

        const imageHTML = document.querySelector(`#pet-${petName} img`);
        const nameHTML = document.querySelector(`#pet-${petName} .pet-name`);

        if (nameHTML) {
            nameHTML.innerHTML = `<a href="${data.pet.remoteRef.serverURL}/pets/${data.pet.remoteRef.id}">${data.pet.name}</a>`;
        }
        // if (imageHTML) {
        //     imageHTML.src = `<a href="${data.pet.remoteRef.serverURL}/pets/${data.pet.remoteRef.id}">${data.pet.imageSrc}</a>`;
        // }

        const activityContainer = document.querySelector(`#pet-${petName} .pet-activity`);
        if (activityContainer) {
            activityContainer.innerHTML = `
            is doing 
            <span class="activity-name keyword">
                    ${data.pet.currentActivityName}

            </span> with 
            <span class="activity-partner keyword"> 
                <a href="${data.pet.activityPartnerRemoteRef ? data.pet.activityPartnerRemoteRef.serverURL 
                    + "/pets/" + 
                    data.pet.activityPartnerRemoteRef.id : "null"}">
                    ${data.pet.currentActivityPartnerName}
                </a>
            </span> in 
            <span class="environment-name keyword"> 
                <a href="${data.pet.environmentRemoteRef ? data.pet.environmentRemoteRef.serverURL 
                        + "/environments/" + 
                        data.pet.environmentRemoteRef.id : "null"}">
                    ${data.pet.environmentName} 
                </a>
            </span>`;
        }

        const statsContainer = document.querySelector(`#pet-${petName} .stats`);
        if (statsContainer) {
            statsContainer.innerHTML = `
            <div>Hunger: ${data.pet.stats.hunger}</div>
            <div>Energy: ${data.pet.stats.energy}</div>
            <div>Happiness: ${data.pet.stats.happiness}</div>
            <div>Boredom: ${data.pet.stats.boredom}</div>`;
        }

        const activityHistoryContainer = document.querySelector(`#pet-container-${petName} .pet-activity-history`);
        if (activityHistoryContainer) {
            activityHistoryContainer.innerHTML = `
                <h3>Activity History</h3>
                <ul>
                    ${ 
                       Object.entries(data.pet.activityHistory).map(([timestamp, entry]) => `
                        <li>
                            <span class="activity-name keyword">${entry.activity.name}</span> with
                            <span class="activity-partner keyword">${entry.partner?.id}</span> at
                            <span class="activity-timestamp">${new Date(entry.timestamp).toLocaleString()}</span>
                        </li>   
                    `).join('')}
                </ul>
                `;
            }

        const relationshipsContainer = document.querySelector(`#pet-container-${petName} .pet-relationships`);
        if (relationshipsContainer){
            relationshipsContainer.innerHTML = processRelationships(data.pet.relationships).activities
        }

    }

    refreshPetViewOnce(petName, baseURL);

    setInterval(async () => {
        await refreshPetViewOnce(petName, baseURL);
    }, 1000);
};

function processRelationships(relationships){
    // -5_-3 -3_-1 so on: hate, dislike, neutral, friendly, best friend
    var activityRelationships = {};
    var entityRelationships = {};
    var numberToFriendliness = (number) => {
        const friendliness = (number + 5) / 10; 
        if (friendliness < 0.2) return "Hate";
        if (friendliness < 0.4) return "Dislike";
        if (friendliness < 0.6) return "Neutral";
        if (friendliness < 0.8) return "Friendly";
        return "Best Friend";
    }

    for (const [thingName, relationship] of Object.entries(relationships)) {
        if ( thingName.includes("VP_UNIQUE_ID")) { // entity
            entityRelationships[thingName] = (relationship.friendliness+5)/10;
        } else {
            activityRelationships[thingName] = (relationship.friendliness+5)/10;
        }
    }
    const activityHTML = '<ul>' + Object.entries(activityRelationships).map(([activityName, friendliness]) => `
        <li>
            <span class="activity-name keyword">${activityName}</span> : 
            <span>${numberToFriendliness((friendliness*10)-5)}</span>
        </li>
    `).join('') +'</ul>';
    const entityHTML = '<ul>' + Object.entries(entityRelationships).map(([entityName, friendliness]) => `
        <li>
            <span class="entity-name keyword">${entityName}</span> :
            <span>${numberToFriendliness((friendliness*10)-5)}</span>
        </li>
    `).join('') +'</ul>';

    return {
        activities: activityHTML,
        entities: entityHTML
    }


}

function setupUserActions(petName, baseURL) {
    async function refreshUserActions() {
        const userActionsContainer = document.querySelector(`#pet-container-${petName} .user-actions`);
        const activities = await fetch(`${baseURL}/pets/${getValidId(petName)}`, {
            method: "GET",
            headers: addNgrokSkipBrowserWarning(new Headers({
                "Content-Type": "application/json"
            }))
        })
        .then(async res => {
            return await res.json().catch(() => null).then(data => {
                if (data && data.pet && data.pet.availableUserActivityNames) {
                    return data.pet.availableUserActivityNames;
                } else {
                    console.error(`Failed to get available activities for pet ${petName}: Invalid response data`, data);
                    return [];
                }
        })
    })

        userActionsContainer.innerHTML = activities.map(activityName => `
            <button class="user-activity-action" onClick="userAskPetToDoActivity('${petName}', '${activityName}', '${baseURL}')">
                ${activityName}
            </button>
        `).join("");
    }

    setInterval(async () => {
        await refreshUserActions();
    }, 1000);
}


// FIXME 10 remove this
function refreshEnvironmentView(environmentName , baseURL) {
    const refreshEnvironmentViewOnce = async (environmentName , baseURL ) => {
    }

    setInterval(async () => {
        await refreshEnvironmentViewOnce(environmentName, baseURL);
    }, 30_000);
}

function updateLoginInformation(baseURL) {
    const refreshLoginInformationOnce = async (baseURL) => {
        const loginData = await fetch(`${baseURL}/current-user`, {
            method: "GET",
            headers: addNgrokSkipBrowserWarning({
                "Content-Type": "application/json"
            })
        });

        const userData = await getValidJson(loginData);
        if (userData && userData.username) {
            document.getElementById("login-information").innerHTML = `
                Logged in as ${userData.username}<br>
            `;
        } else {
            document.getElementById("login-information").innerHTML = `
                Not logged in<br>
            `;
        }
        // document.getElementById("login-information").innerHTML = `
        //     ${userData}<br>
        // `;
    }

    setInterval(async () => {
        await refreshLoginInformationOnce(baseURL);
    }, 1000);

}

// Should take environment remote ref
function saveEnvironmentToLocalStorage(environmentRemoteRef) {
    const environmentId = (environmentRemoteRef.id ? environmentRemoteRef.id : environmentRemoteRef.name).toLowerCase();
    const environmentToSave = {
        id: environmentId,
        remoteRef: environmentRemoteRef
    }

    localStorage.setItem(`environments`, JSON.stringify([...JSON.parse(localStorage.getItem(`environments`) || "[]"), environmentToSave]));
}


async function userAskPetToDoActivity(petName , activityName, baseURL) {
    console.log(`User is asking pet ${petName} to do activity ${activityName}`);
    const response = await fetch(`/pets/${petName}/do-activity`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            activityName: activityName
        })
    });
    // if (!response.ok) {
    //     console.error(`Failed to ask pet ${petName} to do activity ${activityName}: ${response.statusText}`);
    // } else {
    //     console.log(`Successfully asked pet ${petName} to do activity ${activityName}`);
    // }
};

async function userSelectEnvironment(environmentRemoteRef, petName, baseURL) {
    console.log(`User is asking pet ${petName} to move to environment ${environmentRemoteRef.id} at ${environmentRemoteRef.serverURL}, with baseURL ${baseURL}`);
    const response = await fetch(`${baseURL}/pets/${petName}/set-environment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            environmentId: environmentRemoteRef.id,
            environmentServerURL: environmentRemoteRef.serverURL
        })
    });
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
        const response = await fetch(`${baseURL}/pets/${petName}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) {
            console.error(`Failed to refresh pet view for ${petName}: ${response.statusText}`);
            return null;
        }

        const data = await response.json() ;

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
            relationshipsContainer.innerHTML = `
            <h3> Relationships </h3>
            <ul>
                ${ Object.entries(data.pet.relationships).map(([thingName, relationship]) => `
                    <li>
                        <span class="relationship-thing-name keyword">${thingName}</span> : 
                        <span class="relationship-friendliness">${relationship.friendliness}</span>
                    </li>
                `).join('')}
            </ul>
            `;
        }

    }

    refreshPetViewOnce(petName, baseURL);

    setInterval(async () => {
        await refreshPetViewOnce(petName, baseURL);
    }, 1000);
};

function setupUserActions(petName, baseURL) {
    async function refreshUserActions() {
        const userActionsContainer = document.querySelector(`#pet-container-${petName} .user-actions`);
        const activities = await fetch(`${baseURL}/pets/${petName}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
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
        const loginData = await fetch(`${baseURL}/me`)

        const userData = await loginData.text();
        document.getElementById("login-information").innerHTML = `
            ${userData}<br>
        `;
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

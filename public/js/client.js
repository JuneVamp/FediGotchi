

async function updatePets() {
    const response = await fetch(`api/pets`);
    if (!response.ok) {
        console.error("Failed to fetch pets:", response.status, response.statusText);
        return;
    }
    const jsonResponse = await response.json();
    const pets = jsonResponse.pets;

    const container = document.getElementById("pets");

    container.innerHTML = pets.map(pet => { 
        var environmentUrl = pet.environmentRemoteRef ? pet.environmentRemoteRef.serverURL + "/environments/" + pet.environmentRemoteRef.id : "null"
        var activityPartnerUrl = (pet.activityPartnerRemoteRef ? pet.activityPartnerRemoteRef.serverURL + "/pets/" + pet.activityPartnerRemoteRef.id : "null" )
        
        
        return `
        <div class="pet" id="pet-${pet.name}">
            <img src="${pet.imageSrc}">
            <div class="pet-name">${pet.name}</div>
            <div class="pet-activity">is doing 
                <keyword> ${pet.currentActivityName}</keyword> with 
                <a href="${activityPartnerUrl}">
                    <keyword> ${pet.currentActivityPartnerName} </keyword>
                </a> in 
                <a href="${environmentUrl}">
                    <keyword> ${pet.environmentName} </keyword>
                </a>
            </div>
            <div class="stats"></div>
            <div class="user-actions">
                <button onclick="userAskPetToDoActivity('userJune', '${pet.name}', 'play')">Play</button>
                <button onclick="userAskPetToDoActivity('userJune', '${pet.name}', 'eat')">Eat</button>
                <button onclick="userAskPetToDoActivity('userJune', '${pet.name}', 'sleep')">Sleep</button>
            </div>
        </div>
    `}).join("");

    for (const pet of pets) {
        const statsContainer = document.querySelector(`#pet-${pet.name} .stats`);
        statsContainer.innerHTML = `
            <div>Hunger: ${pet.stats.hunger}</div>
            <div>Energy: ${pet.stats.energy}</div>
            <div>Happiness: ${pet.stats.happiness}</div>
            <div>Boredom: ${pet.stats.boredom}</div>
        `;
    }
}
// updatePets();
// setInterval(updatePets, 1000);

async function updateEnvironments() {
    const response = await fetch(`api/environments`);
    if (!response.ok) {
        console.error("Failed to fetch environments:", response.status, response.statusText);
        return;
    }
    const jsonResponse = await response.json();
    const environments = jsonResponse.environments;

    const container = document.getElementById("environments");

    const environmentHtml = await Promise.all(environments.map(async (env) => {
        const petResponse = await fetch(`${env.serverURL}/environments/${env.id}/pets`);
        const petJsonResponse = await petResponse.json();
        const envPets = petJsonResponse.pets.map(pet => pet.id)
        // .join(", ");
        const petHtml = [];
        for (const pet of envPets) {
            petHtml.push(`<a href="${env.serverURL}/pets/${pet}">${pet}</a>`);
        }

        return `
            <div class="environment" id="environment-${env.id}"> 
                <div class="environment-name">${env.displayName}</div>
                <div class="environment-pets">${petHtml.join(", ")}</div>
            </div>
        `;
    }));

    container.innerHTML = environmentHtml.join("");
}
// updateEnvironments();
// setInterval(updateEnvironments, 1000);

// function userAskPetToDoActivity(userName, petName, activity) {
//     fetch(`/api/pets/${petName}/post`, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//             postType: "UserPetActivity",
//             userName: userName,
//             activityName: activity
//         })
//     })
//     // .then(response => {
//     //     console.log(response.json())
//     // })

// }

function userAskPetToDoActivity(petName , activityName ) {
    console.log(`User is asking pet ${petName} to do activity ${activityName}`);
    // const response = await fetch(`/pets/${petName}/do-activity`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify({
    //         activityName: activityName
    //     })
    // });
    // if (!response.ok) {
    //     console.error(`Failed to ask pet ${petName} to do activity ${activityName}: ${response.statusText}`);
    // } else {
    //     console.log(`Successfully asked pet ${petName} to do activity ${activityName}`);
    // }
};

function userMovePetToNewEnvironment(petName ) {
    console.log(`User is asking pet ${petName} to move to a new environment`);
}

function refreshPetView(petName , baseUrl) {
    const refreshPetViewOnce = async (petName , baseUrl ) => {
        const response = await fetch(`${baseUrl}/pets/${petName}`, {
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

    refreshPetViewOnce(petName, baseUrl);

    setInterval(async () => {
        await refreshPetViewOnce(petName, baseUrl);
    }, 1000);
};

// FIXME 10 remove this
function refreshEnvironmentView(environmentName , baseUrl) {
    const refreshEnvironmentViewOnce = async (environmentName , baseUrl ) => {
    }

    setInterval(async () => {
        await refreshEnvironmentViewOnce(environmentName, baseUrl);
    }, 30_000);
}

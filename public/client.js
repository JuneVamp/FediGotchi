async function updatePets() {
    const response = await fetch("api/pets");
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
updatePets();
setInterval(updatePets, 1000);

async function updateEnvironments() {
    const response = await fetch("api/environments");
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

function userAskPetToDoActivity(userName, petName, activity) {
    fetch(`/api/pets/${petName}/post`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            postType: "UserPetActivity",
            userName: userName,
            activityName: activity
        })
    })
    // .then(response => {
    //     console.log(response.json())
    // })

}
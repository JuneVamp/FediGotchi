
export const htmlLayoutString = ([children], baseUrl) => {
    return `
        <!doctype html>
        <html>
            <head>
                <meta charset="utf-8">
                <title>FediFlock</title>
                <link rel="stylesheet" href="${baseUrl}/styles/style.css">
            </head>
            <body>
            <script src="${baseUrl}/client.js"> </script>
                ${children}
            </body>
        </html>
    `
}

// PET STRINGS

export const petViewLayoutString = (pet, baseUrl, [...children]) => {
    return `
        <div class="pet-container" id="pet-container-${pet.name}">
            <div class="pet" id="pet-${pet.name}">
                ${children}
            </div>
        </div>
    `;
};

export const petViewHtmlString = (pet, baseUrl) => {
    return `
        <script>
            console.log('${baseUrl}');
            refreshPetView('${pet.name}', '${baseUrl}');
        </script>
        <img src="${baseUrl}/${pet.imageSrc}" />
        <div class="pet-name">${pet.name}</div>
        <div class="pet-activity"> CODE DEFINED </div>
        <div class="stats"> CODE DEFINE </div>
        <div class="user-actions">
            <button class="user-activity-action" onClick="userAskPetToDoActivity('${pet.name}', 'play')">Play</button>
            <button class="user-activity-action" onClick="userAskPetToDoActivity('${pet.name}', 'eat')">Eat</button>
            <button class="user-activity-action" onClick="userAskPetToDoActivity('${pet.name}', 'sleep')">Sleep</button>
        </div>
        <button class="environment-move" onClick="userMovePetToNewEnvironment('${pet.name}')">move to new environment</button>
    `;
}

export const petActivityHistoryHtmlString = () => {
    return `
        <div class="pet-activity-history"></div>
    `;
}


// ENVIRONMENT STRINGS

export const environmentHtmlString = (environment, baseUrl, [... petChildren]) => {
    const environmentId = (environment.id ? environment.id : environment.name).toLowerCase();
    return `
        <div class="environment" id="environment-${environmentId}">
            <script>
                console.log('${baseUrl}');
                refreshEnvironmentView('${environmentId}', '${baseUrl}');
            </script>
            <div class="environment-name">${environmentId}</div>
            <div class="environment-pets">${petChildren.join('')}</div>
        </div>
    `
}


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
            <script></script>
                ${children}
            </body>
        </html>
    `
}

export const petViewHtmlString = (pet, baseUrl) => {
    return `
        <div id="pet-container">
            <div class="pet" id="pet-${pet.name}">
                <script src="${baseUrl}/client.js"></script>
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
            </div>
        </div>
    `;
};
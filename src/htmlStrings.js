// I could have used React but I tried and hated it so this is my version of react
// TODO 10 someday change this to React or hono/jsx

export const htmlLayoutString = ([...children], baseURL) => {
    return `
        <!doctype html>
        <html>
            <head>
                <meta charset="utf-8">
                <title>FediFlock</title>
                <link rel="stylesheet" href="${baseURL}/styles/style.css">
            </head>
            <body>
            <script src="${baseURL}/js/client.js"> </script>
            <script src="${baseURL}/js/apiHelper.js"> </script>
                ${children.join("")}
            </body>
        </html>
    `
}

// PET STRINGS

export const petViewLayoutString = (pet, baseURL, [...children]) => {
    return `
        <div class="pet-container" id="pet-container-${pet.name}">
            <div class="pet" id="pet-${pet.name}">
                ${children.join("")}
            </div>
        </div>
    `;
};

export const petViewHtmlString = (pet, baseURL) => {
    return `
        <script>
            console.log('${baseURL}');
            refreshPetView('${pet.name}', '${baseURL}');
        </script>
        <img src="${baseURL}/${pet.imageSrc}" />
        <div class="pet-name">${pet.name}</div>
        <div class="pet-activity"> CODE DEFINED </div>
        <div class="stats"> CODE DEFINE </div>
    `;
}

export const petActivityHistoryHtmlString = () => {
    return `
        <div class="pet-activity-history"></div>
    `;
}

export const petRelationshipsHtmlString = () => {
    return `
        <div class="pet-relationships"></div>
    `;

}

export const petUserActionsHtmlString = (pet, baseURL) => {
            //examples
            // <button class="user-activity-action" onClick="userAskPetToDoActivity('${pet.name}', 'play')">Play</button>
            // <button class="user-activity-action" onClick="userAskPetToDoActivity('${pet.name}', 'eat')">Eat</button>
            // <button class="user-activity-action" onClick="userAskPetToDoActivity('${pet.name}', 'sleep')">Sleep</button>
    return `
        <div class="user-actions">  </div>
        <script>
            setupUserActions('${pet.name}', '${baseURL}');
        </script>
        <button class="environment-move" onClick="userMovePetToNewEnvironment('${pet.name}', '${baseURL}')">move to new environment</button>
    `;
}


// ENVIRONMENT STRINGS

export const environmentHtmlString = (environment, baseURL, [... petChildren]) => {
    const environmentId = (environment.id ? environment.id : environment.name).toLowerCase();
    return `
        <div class="environment" id="environment-${environmentId}">
            <script>
                console.log('${baseURL}');
                refreshEnvironmentView('${environmentId}', '${baseURL}');
            </script>
            <div class="environment-name">${environmentId}</div>
            <button id="save-environement-local-storage" onClick='saveEnvironmentToLocalStorage(${JSON.stringify(environment.remoteRef)})'>Save locally</button>
            <div class="environment-pets">${petChildren.join('')}</div>
        </div>
    `
}

export const loginBox = (baseURL) => {
    return `
        <form id="loginform" action="${baseURL}/login" method="POST">
            <label for="username">Login: </label>
            <input type="text" id="login-form-username" name="username">
            <input type="submit" value="Submit">
        </form>
        <span id="login-information">
            Not logged in
        </span>
        <script>
            updateLoginInformation('${baseURL}');
        </script>

    `
}

export const signupform = () => {
    return `
        <form id="signupform" action="javascript:signupUser()">
            <label for="userId">Signup: </label>
            <input type="text" id="signup-form-userId" name="userId">
            <label for="password">Password: </label>
            <input type="password" id="signup-form-password" name="password">
            <input type="submit" value="Submit">
        </form>
        <script>
            function signupUser () {
                const userId = document.getElementById("signup-form-userId").value
                const password = document.getElementById("signup-form-password").value
                localStorage.setItem("userId", userId)
                localStorage.setItem("password", password)
                location.reload()
            }
        </script>
    `
}

export const htmlLayoutString = ([...children], baseUrl) => {
    return `
        <!doctype html>
        <html>
            <head>
                <meta charset="utf-8">
                <title>FediFlock</title>
                <link rel="stylesheet" href="${baseUrl}/styles/style.css">
            </head>
            <body>
            <script>
            window.baseUrl = "${baseUrl}";
            </script>
            <script src="${baseUrl}/js/client.js"> </script>
                ${children.join("")}
            </body>
        </html>
    `
}

// PET STRINGS

export const petViewLayoutString = (pet, baseUrl, [...children]) => {
    return `
        <div class="pet-container" id="pet-container-${pet.name}">
            <div class="pet" id="pet-${pet.name}">
                ${children.join("")}
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
    // return `
    //     <div class="pet-activity-history"></div>
    //     <div class="pet-relationships"></div>
    // `;
    return `
        <div class="pet-relationships"></div>
    `;
}

export const petRelationshipsHtmlString = () => {

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

export const loginBox = (baseUrl) => {
    // return `
    //     <form id="loginform" action="javascript:setUserId()">
    //         <label for="userId">Login: </label>
    //         <input type="text" id="login-form-userId" name="userId">
    //         <label for="password">Password: </label>
    //         <input type="password" id="login-form-password" name="password">
    //         <input type="submit" value="Submit">
    //     </form>
    //     <span id="login-information">
    //         Not logged in
    //     </span>
    //     <script>
    //         document.getElementById("login-information").innerHTML = "logged in as: " + "<span id='user-information-userid'>" + localStorage.getItem("userId") + "</span>"
    //         function setUserId () {
    //             const userId = document.getElementById("login-form-userId").value
    //             const password = document.getElementById("login-form-password").value
    //             localStorage.setItem("userId", userId)
    //             localStorage.setItem("password", password)
    //             location.reload()
    //         }
    //     </script>
    // `

    return `
        <form>
            <input id="login-username" type="text" placeholder="Username" required />
            <input id="login-password" type="password" placeholder="Password" required />
            <button type="submit" id="login">Login</button>
        </form>
        <script src="${baseUrl}/js/login.js"> </script>
    `
}

export const signupform = (baseUrl) => {
    // return `
    //     <form id="signupform" action="javascript:signupUser()">
    //         <label for="userId">Signup: </label>
    //         <input type="text" id="signup-form-userId" name="userId">
    //         <label for="password">Password: </label>
    //         <input type="password" id="signup-form-password" name="password">
    //         <input type="submit" value="Submit">
    //     </form>
    //     <script>
    //         function signupUser () {
    //             const userId = document.getElementById("signup-form-userId").value
    //             const password = document.getElementById("signup-form-password").value
    //             localStorage.setItem("userId", userId)
    //             localStorage.setItem("password", password)
    //             location.reload()
    //         }
    //     </script>
    // `

    return `
        <form>
            <input id="email" type="email" placeholder="Email" required />
            <input id="username" type="text" placeholder="Username" required />
            <input id="password" type="password" placeholder="Password" required />
            <button type="submit" id="signup">Sign Up</button>
        </form>
        <script src="${baseUrl}/js/signup.js"> </script>
    `
}
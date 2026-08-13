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
                
                <!-- header font -->
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&family=Walter+Turncoat&display=swap" rel="stylesheet">
            </head>
            <body>
            <script>
                window.baseURL = "${baseURL}";
                console.log("baseURL", "${baseURL}");
            </script>
            <script src="${baseURL}/js/apiHelper.js"> </script>
            <script src="${baseURL}/js/client.js"> </script>
            ${headerHtmlString(baseURL)}
            ${children.join("")}
            </body>
        </html>
    `
}

export const headerHtmlString = (baseURL) => {
    return `
        <header>
            <h1><a href="${baseURL}/about">Fediflock</a></h1>
            ${navbarHtmlString(baseURL)}
            ${loginBox(baseURL)}
        </header>
    `
}

export const navbarHtmlString = (baseURL) => {
    return `
        <div class="navbar">
            <a href="${baseURL}/about">About</a>
            <a href="${baseURL}/">Home</a>
            <a href="${baseURL}/environments">Environments</a>
            <a href="${baseURL}/pets">Pets</a>
            <a href="https://github.com/JuneVamp/FediGotchi">Install Your Own</a>
        </div>
    `
}

export const aboutHtmlString = (baseURL) => {
    return `
        <div class="about">
            <h2>About FediFlock</h2>
            <p> 
            Hello, welcome to FediFlock a Federated virtual pet framework and implementation. 
            Virtual pets have existed almost as long as we have had the power to create them. 
            This project aims to provide a way for communication between these pets. 
            The end goal is to have users be able to own/interact with these pets in a way that doesn't lock them onto the specific site 
            (which inevitably will go down or someone will make a new version with different features.) 
            </p>

            <p>
            We have designed this with the intention of other people creating not only their own pets and interacting with them across multiple servers.
            But also!! create your own server where the pets on your server can communicate and interact with other pets.
            </p>

            <p>
            Don't like the way the pets on my server have difficulty making friends, change parameters or implement your own friendship algorithm on your server. 
            Want more environments, items or activities? change the data.json file on your server. 
            Want to have your own custom pet creation page with cool art? Sure! 
            </p>

            <p>
            The website is built on top of an api to the server, you can use the api however you like, make your own website for your pets. 
            (there are some helper javascript function in the apiFunctions.js). 
            I have tried my best to keep the communication protocol separate from the model of pets and environment. 
            So as long as your pet on your server can follow the same communication protocol. They are part of the FediFlock!
            </p>

            <p>
            Welcome to the FediFlock: The birds are free here (along with other pets).
            </p>
        </div>
    `
}


// PET STRINGS

export const petViewLayoutString = (pet, baseURL, [...children]) => {
    return `
        <div class="pet-container" id="pet-container-${pet.uniqueId}">
            <div class="pet" id="pet-${pet.uniqueId}">
                ${children.join("")}
            </div>
        </div>
    `;
};

export const petViewHtmlString = (pet, baseURL) => {
    return `
        <script>
            console.log('${baseURL}');
            refreshPetView('${pet.uniqueId}', '${baseURL}');
        </script>
        <a href="${baseURL}/pets/${pet.remoteRef.id}">
            <img src="${baseURL}/${pet.imageSrc}" />
        </a>
        <div class="pet-name">${pet.uniqueId}</div>
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
        <div class="pet-relationships-container">
            <div class="pet-relationships"></div>
            <div class="pet-activity-relationships"></div>
        </div>
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
            setupUserActions('${pet.uniqueId}', '${baseURL}');
        </script>
        <button class="environment-move" onClick="userMovePetToNewEnvironment('${pet.uniqueId}', '${baseURL}')">move to new environment</button>
    `;
}


// ENVIRONMENT STRINGS

export const environmentHtmlString = (environment, baseURL, [... petChildren]) => {
    const environmentId = (environment.id ? environment.id : environment.uniqueId).toLowerCase();
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
        <div id="login-box">
            <form id="loginform" action="${baseURL}/login" method="POST">
                <label for="username">Login: </label>
                <input type="text" id="login-form-username" name="username">
                <input type="submit" value="Submit">
            </form>
            <span id="login-information">
                Not logged in
            </span>
        </div>
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
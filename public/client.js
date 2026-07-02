function userAskPetToDoActivity(userName, petName, activity) {
    fetch(`fediflock/api/pets/${petName}/post`, {
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
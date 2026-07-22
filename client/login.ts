import { authClient } from "./auth-client";

document.getElementById("login")!.onclick = async () => {

    const email =
        (document.getElementById("email") as HTMLInputElement).value;

    const password =
        (document.getElementById("password") as HTMLInputElement).value;

    const result = await authClient.signIn.email({
        email,
        password,
    });

    console.log(result);
};
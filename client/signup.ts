import { authClient } from "./auth-client";

document.getElementById("signup")!.onclick = async () => {
    const email =
        (document.getElementById("email") as HTMLInputElement).value;

    const password =
        (document.getElementById("password") as HTMLInputElement).value;

    const name =
        (document.getElementById("name") as HTMLInputElement).value;

    const result = await authClient.signUp.email({
        email,
        password,
        name,
    });

    console.log(result);
};
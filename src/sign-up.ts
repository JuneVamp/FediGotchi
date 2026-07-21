import { authClient } from "./lib/auth-client";

type SignUpInput = {
    email: string;
    password: string;
    name: string;
    image?: string;
    callbackURL?: string;
};

export async function signUpWithEmail(input: SignUpInput) {
    const { callbackURL = "/dashboard", ...payload } = input;

    return authClient.signUp.email(
        {
            ...payload,
            callbackURL,
        },
        {
            onError: (ctx) => {
                console.error("Sign-up failed:", ctx.error.message);
            },
        }
    );
}
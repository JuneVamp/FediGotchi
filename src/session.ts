import crypto from "node:crypto";

const sessions = new Map<string, string>();

export function createSession(username: string) {
    const sessionId = crypto.randomUUID();

    sessions.set(sessionId, username);

    return sessionId;
}

export function getUser(sessionId: string | undefined) {
    if (!sessionId) return null;

    return sessions.get(sessionId) ?? null;
}

export function destroySession(sessionId: string | undefined) {
    if (!sessionId) return;

    sessions.delete(sessionId);
}